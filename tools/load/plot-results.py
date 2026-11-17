"""Generate publication artifacts from saved measurements; never hand-enter metrics."""
import csv
import json
from pathlib import Path
from statistics import median
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path('artifacts/capacity')
baseline = json.loads((root / 'baseline.json').read_text(encoding='utf-8'))
optimized = json.loads((root / 'optimized.json').read_text(encoding='utf-8'))
before_profile = json.loads((root / 'baseline-profile.json').read_text(encoding='utf-8'))
after_profile = json.loads((root / 'optimized-profile.json').read_text(encoding='utf-8'))
assert before_profile['fixture']['logicalSha256'] == after_profile['fixture']['logicalSha256']
assert before_profile['resultHash'] == after_profile['resultHash']
all_runs = [('Baseline', r) for r in baseline['runs']] + [('Optimized', r) for r in optimized['runs']]
assert len({r['fixture']['logicalSha256'] for _, r in all_runs}) == 1
assert all(not rows for _, run in all_runs for rows in run['invariants'].values())
fields = ['version', 'commit', 'repetition', 'users', 'requests', 'listing_p50_ms', 'listing_p95_ms', 'rps', 'error_percent', 'backend_cpu_one_core_percent', 'backend_peak_rss_mib', 'event_loop_p95_ms', 'recovery_ms', 'acquisition_retries', 'transaction_retries']
rows = []
for label, run in all_runs:
    parent = baseline if label == 'Baseline' else optimized
    rows.append(dict(zip(fields, [label, parent['commit'], run['repetition'], run['users'], run['aggregate']['requests'], run['operations']['catalog']['p50Ms'], run['operations']['catalog']['p95Ms'], run['aggregate']['requestsPerSecond'], 100 * run['aggregate']['errors'] / run['aggregate']['requests'], (run['resources']['userCpuMs'] + run['resources']['systemCpuMs']) / (run['drainedSeconds'] * 10), run['resources']['peakRssBytes'] / 1024**2, run['resources']['eventLoopP95Ms'], run['recoveryMs'], run['resources']['acquisitionRetries'], run['resources']['transactionRetries']])))
with (root / 'comparison.csv').open('w', newline='', encoding='utf-8') as stream:
    writer = csv.DictWriter(stream, fieldnames=fields); writer.writeheader(); writer.writerows(rows)
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
fig, axes = plt.subplots(2, 3, figsize=(14, 8), layout='constrained')
metrics = [('listing_p95_ms', 'Catalog p95 (ms)'), ('rps', 'Completed requests / second'), ('error_percent', 'Unexpected errors (%)'), ('backend_cpu_one_core_percent', 'Backend CPU (% of one core)'), ('backend_peak_rss_mib', 'Backend peak RSS (MiB)'), ('event_loop_p95_ms', 'Backend event-loop p95 (ms)')]
summary = {}
for axis, (metric, title) in zip(axes.flat, metrics):
    for version, color in [('Baseline', '#923951'), ('Optimized', '#168b9d')]:
        levels = sorted({r['users'] for r in rows if r['version'] == version})
        groups = [[r[metric] for r in rows if r['version'] == version and r['users'] == level] for level in levels]
        centers = [median(g) for g in groups]
        axis.errorbar(levels, centers, yerr=[[c - min(g) for c, g in zip(centers, groups)], [max(g) - c for c, g in zip(centers, groups)]], color=color, marker='o', capsize=4, label=version)
    axis.set_title(title); axis.set_xlabel('Concurrent users'); axis.set_xticks([10, 50, 100]); axis.grid(alpha=.18)
    if metric == 'listing_p95_ms': axis.axhline(800, color='#777', linestyle='--', linewidth=1, label='Draft 800ms target')
axes[0, 0].legend(fontsize=8)
fig.suptitle('Electiva: matched ordinary-user workload\nMedians and min–max across three independent runs; 3s warmup / 12s steady / 3s recovery', fontsize=13)
for suffix in ['png', 'svg']: fig.savefig(root / f'comparison.{suffix}', dpi=180)
plt.close(fig)
fig, axes = plt.subplots(1, 2, figsize=(10, 4), layout='constrained')
for axis, metric, title in zip(axes, ['listing_p50_ms', 'listing_p95_ms'], ['Catalog p50 (ms)', 'Catalog p95 (ms)']):
    for version, color in [('Baseline', '#923951'), ('Optimized', '#168b9d')]:
        levels = [10, 50, 100]
        groups = [[r[metric] for r in rows if r['version'] == version and r['users'] == level] for level in levels]
        centers = [median(g) for g in groups]
        axis.errorbar(levels, centers, yerr=[[c - min(g) for c, g in zip(centers, groups)], [max(g) - c for c, g in zip(centers, groups)]], marker='o', color=color, capsize=4, label=version)
    axis.set_title(title); axis.set_xlabel('Concurrent users'); axis.set_xticks([10, 50, 100]); axis.grid(alpha=.2)
axes[0].legend(); fig.suptitle('Catalog latency: medians and min–max of three matched repetitions')
for suffix in ['png', 'svg']: fig.savefig(root / f'latency.{suffix}', dpi=180)
plt.close(fig)
for version in ['Baseline', 'Optimized']:
    summary[version] = {}
    for level in [10, 50, 100]:
        selected = [r for r in rows if r['version'] == version and r['users'] == level]
        summary[version][str(level)] = {metric: {'median': median(r[metric] for r in selected), 'min': min(r[metric] for r in selected), 'max': max(r[metric] for r in selected)} for metric, _ in metrics}
summary['profile'] = {label: {'median_p50_ms': median(r['p50Ms'] for r in report['repetitions']), 'median_p95_ms': median(r['p95Ms'] for r in report['repetitions'])} for label, report in [('Baseline', before_profile), ('Optimized', after_profile)]}
summary['fixtureSha256'] = before_profile['fixture']['logicalSha256']; summary['resultSha256'] = before_profile['resultHash']
stress_files = [('Baseline', root / 'baseline-saturation.json'), ('Optimized', root / 'optimized-saturation.json')]
stress = [(label, json.loads(file.read_text(encoding='utf-8'))) for label, file in stress_files if file.exists()]
if stress:
    fig, axes = plt.subplots(1, 3, figsize=(13, 4), layout='constrained')
    for label, report in stress:
        levels = sorted({r['users'] for r in report['runs']}); color = '#923951' if label == 'Baseline' else '#168b9d'
        for axis, metric in zip(axes, ['latency', 'rps', 'errors']):
            def value(run):
                return run['operations']['catalog']['p95Ms'] if metric == 'latency' else run['aggregate']['requestsPerSecond'] if metric == 'rps' else 100 * run['aggregate']['errors'] / run['aggregate']['requests']
            axis.plot(levels, [median(value(r) for r in report['runs'] if r['users'] == level) for level in levels], marker='o', color=color, label=label)
            axis.set_xlabel('Concurrent users, no think time'); axis.grid(alpha=.2)
    for axis, title in zip(axes, ['Catalog p95 (ms)', 'Completed requests / second', 'Unexpected errors (%)']): axis.set_title(title)
    axes[0].axhline(800, color='#777', linestyle='--'); axes[0].legend(fontsize=8)
    fig.suptitle('Separate overload model; medians of available repetitions, safety stops retained')
    for suffix in ['png', 'svg']: fig.savefig(root / f'saturation.{suffix}', dpi=180)
    summary['saturation'] = {label: {'runs': len(report['runs']), 'testedLevels': sorted({r['users'] for r in report['runs']}), 'resourceStop': report.get('stoppedForResourceSafety', False)} for label, report in stress}
(root / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary, indent=2))
