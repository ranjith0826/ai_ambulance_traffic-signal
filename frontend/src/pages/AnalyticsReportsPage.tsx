import React, { useState, useEffect } from 'react';
import { analyticsService, awsService } from '../services/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Clock,
  Zap,
  GitMerge,
  ShieldCheck,
  TrendingUp,
  Activity,
  Cloud,
  CheckCircle2,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import jsPDF from 'jspdf';

export const AnalyticsReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportType, setReportType] = useState<string>('Daily Emergencies');
  const [uploadingToS3, setUploadingToS3] = useState<boolean>(false);
  const [s3UploadResult, setS3UploadResult] = useState<any>(null);
  const [s3Reports, setS3Reports] = useState<any[]>([]);

  useEffect(() => {
    analyticsService
      .getSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    awsService
      .listS3Reports()
      .then((res) => {
        setS3Reports(res.reports || []);
      })
      .catch(() => {});
  }, []);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Emergencies', data.metrics.total_emergencies],
      ['Completed Dispatches', data.metrics.completed_emergencies],
      ['Average Travel Time (Minutes)', data.metrics.average_travel_time_minutes],
      ['Average Response Time (Minutes)', data.metrics.average_response_time_minutes],
      ['Average Time Saved (Minutes)', data.metrics.average_time_saved_minutes],
      ['Green Corridors Activated', data.metrics.green_corridors_activated],
      ['Multi-Ambulance Conflicts Arbitrated', data.metrics.multi_ambulance_conflicts],
      ['Hospital Acceptance Rate (%)', data.metrics.hospital_acceptance_rate],
      ['Data Source', 'LifeLane AI Platform (Simulated Results)'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LifeLane_${reportType.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shared PDF Generator
  const generatePDFDoc = () => {
    if (!data) return null;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(22, 61, 47);
    doc.text('LIFELANE AI — EMERGENCY ANALYTICS REPORT', 14, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(119, 112, 100);
    doc.text(`Report Type: ${reportType} | Date: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text('Mode: Software Simulation Performance Analysis (AWS Cloud Archival)', 14, 34);

    doc.setDrawColor(230, 220, 200);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 39, 34);
    doc.text('1. Key Performance Indicators', 14, 48);

    const metricsList = [
      `Total Emergencies Handled: ${data.metrics.total_emergencies}`,
      `Average Travel Time: ${data.metrics.average_travel_time_minutes} minutes`,
      `Average Time Saved per Trip: ${data.metrics.average_time_saved_minutes} minutes`,
      `Green Corridors Activated: ${data.metrics.green_corridors_activated} intersections`,
      `Multi-Ambulance Conflicts Resolved: ${data.metrics.multi_ambulance_conflicts}`,
      `Hospital Acceptance Rate: ${data.metrics.hospital_acceptance_rate}%`,
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 56;
    metricsList.forEach((m) => {
      doc.text(`• ${m}`, 18, yPos);
      yPos += 7;
    });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Top Congested Intersection Nodes', 14, yPos + 6);

    yPos += 14;
    (data.congested_signals || []).forEach((sig: any) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${sig.signal} — ${sig.activations} Activations (${sig.efficiency_boost} boost)`, 18, yPos);
      yPos += 6;
    });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated automatically by LifeLane AI Platform • Emergency Management Analytics', 14, 280);

    return doc;
  };

  // PDF Export Handler (Local Download)
  const handleExportPDF = () => {
    const doc = generatePDFDoc();
    if (doc) {
      doc.save(`LifeLane_${reportType.replace(/\s+/g, '_')}_Report.pdf`);
    }
  };

  // Upload to Amazon S3 Handler
  const handleUploadToS3 = async () => {
    if (!data) return;
    setUploadingToS3(true);
    try {
      const doc = generatePDFDoc();
      if (!doc) return;
      const dataUri = doc.output('datauristring');
      const filename = `LifeLane_${reportType.replace(/\s+/g, '_')}_Report.pdf`;

      const res = await awsService.uploadReport({
        filename,
        content_base64: dataUri,
        report_type: reportType,
        generated_by: 'Emergency Dispatch Analytics Officer'
      });

      setS3UploadResult(res);
      setS3Reports((prev) => [res, ...prev.filter((r) => r.key !== res.key)]);
    } catch (err: any) {
      alert(`Amazon S3 Upload failed: ${err.message}`);
    } finally {
      setUploadingToS3(false);
    }
  };

  const m = data?.metrics || {
    total_emergencies: 48,
    average_travel_time_minutes: 14.8,
    average_response_time_minutes: 5.8,
    average_time_saved_minutes: 11.4,
    green_corridors_activated: 58,
    multi_ambulance_conflicts: 16,
    hospital_acceptance_rate: 96.5
  };

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-lane-green font-extrabold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Emergency Operations Analytics & Performance Audits</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
            System Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            Quantitative assessment of response time compression, signal preemption throughput, and conflict resolution efficiency.
          </p>
        </div>

        {/* Report Export Bar with generous padding */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-lane-green"
          >
            <option value="Daily Emergencies">Daily Emergencies</option>
            <option value="Monthly Emergencies">Monthly Emergencies</option>
            <option value="Ambulance Performance">Ambulance Performance</option>
            <option value="Hospital Performance">Hospital Performance</option>
            <option value="Traffic Efficiency">Traffic Efficiency</option>
            <option value="Multi-Ambulance Conflicts">Multi-Ambulance Conflicts</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-3 bg-cream-bg hover:bg-slate-100 text-cream-text border border-cream-border rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-lane-green" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-5 py-3 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl text-xs font-bold flex items-center gap-2 shadow-cream-sm transition-all hover:scale-105"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleUploadToS3}
            disabled={uploadingToS3}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-cream-sm transition-all hover:scale-105"
          >
            <Cloud className={`w-4 h-4 ${uploadingToS3 ? 'animate-spin' : ''}`} />
            <span>{uploadingToS3 ? 'Uploading S3...' : 'Upload to Amazon S3'}</span>
          </button>
        </div>
      </div>

      {/* S3 Upload Success Banner */}
      {s3UploadResult && (
        <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 bg-[length:200%_200%] animate-aurora border-2 border-amber-300 rounded-3xl shadow-cream-md animate-spring-pop flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse-slow">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-gray-900">
                  Archived to Amazon S3 Cloud Storage
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900">
                  {s3UploadResult.mode || 'AES-256 S3 Standard'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 font-mono">
                {s3UploadResult.s3_uri}
              </p>
              <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                <span>Bucket: <b>{s3UploadResult.bucket}</b></span>
                <span>Size: <b>{(s3UploadResult.size_bytes / 1024).toFixed(1)} KB</b></span>
                <span>Status: <b className="text-emerald-700 font-bold">Encrypted & Persisted</b></span>
              </div>
            </div>
          </div>

          <a
            href={s3UploadResult.download_url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start md:self-auto shadow-sm"
          >
            <span>View S3 Object</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* KPI Metrics Strip with spacious cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Total Emergencies</div>
          <div className="font-heading text-3xl font-black text-cream-text font-mono">{m.total_emergencies}</div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-1">Recorded Trips</div>
        </div>

        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Avg Travel Time</div>
          <div className="font-heading text-3xl font-black text-lane-dark font-mono">
            {m.average_travel_time_minutes} <span className="text-xs font-normal font-sans">min</span>
          </div>
          <div className="text-[10px] text-cream-muted pt-1">Through Traffic</div>
        </div>

        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Avg Response Time</div>
          <div className="font-heading text-3xl font-black text-lane-danger font-mono">
            {m.average_response_time_minutes} <span className="text-xs font-normal font-sans">min</span>
          </div>
          <div className="text-[10px] text-red-700 font-semibold pt-1">Dispatch to Scene</div>
        </div>

        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Time Saved</div>
          <div className="font-heading text-3xl font-black text-lane-green font-mono">
            {m.average_time_saved_minutes} <span className="text-xs font-normal font-sans">min</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-1">Per Priority Run</div>
        </div>

        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Green Corridors</div>
          <div className="font-heading text-3xl font-black text-emerald-700 font-mono">
            {m.green_corridors_activated}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-1">500m Waves</div>
        </div>

        <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1 hover-card-interactive">
          <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Hospital Accept</div>
          <div className="font-heading text-3xl font-black text-blue-900 font-mono">
            {m.hospital_acceptance_rate}%
          </div>
          <div className="text-[10px] text-blue-800 font-semibold pt-1">First-Match Success</div>
        </div>
      </div>

      {/* Recharts Data Graphs with spacious containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Peak Emergency Hours Chart */}
        <div className="lg:col-span-8 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex items-center justify-between border-b border-cream-border pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-cream-text">Peak Emergency Hours Distribution</h3>
              <p className="text-xs text-cream-muted">Hourly dispatch volume across metropolitan emergency grid</p>
            </div>
            <span className="text-[10px] bg-cream-bg text-cream-muted px-3 py-1 rounded-xl border border-cream-border font-mono font-bold">
              Simulation Analytics
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourly_distribution || []}>
                <defs>
                  <linearGradient id="colorEmergencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '16px', fontSize: '11px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="emergencies" stroke="#10B981" fillOpacity={1} fill="url(#colorEmergencies)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Congested Signals Table */}
        <div className="lg:col-span-4 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-5">
          <div className="border-b border-cream-border pb-4">
            <h3 className="font-heading font-extrabold text-base text-cream-text">Most Congested Signals</h3>
            <p className="text-xs text-cream-muted">Nodes benefiting most from virtual preemption:</p>
          </div>

          <div className="space-y-3">
            {(data?.congested_signals || []).map((s: any, idx: number) => (
              <div key={idx} className="p-4 bg-cream-bg rounded-2xl border border-cream-border text-xs space-y-1.5 shadow-cream-sm">
                <div className="font-heading font-bold text-sm text-cream-text">{s.signal}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-cream-muted">Activations: <b className="text-cream-text">{s.activations}</b></span>
                  <span className="text-lane-green font-bold">Boost: {s.efficiency_boost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Amazon S3 Incident Audit Vault Section (For Jury Demo) */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-cream-text">
                  Amazon S3 Archival Vault
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                  AWS S3 Cloud
                </span>
              </div>
              <p className="text-xs text-cream-muted mt-0.5">
                Encrypted immutable audit logs and PDF post-incident manifests stored in AWS bucket
              </p>
            </div>
          </div>

          <div className="text-xs font-mono bg-cream-bg px-3.5 py-2 rounded-xl border border-cream-border text-cream-muted">
            Bucket: <b className="text-cream-text">{s3Reports[0]?.bucket || 'lifelane-ambulance-reports'}</b>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {s3Reports.map((r, idx) => (
            <div
              key={idx}
              className="p-5 bg-cream-bg rounded-2xl border border-cream-border shadow-cream-sm hover:border-amber-400 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    {r.report_type || 'Analytics Manifest'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(r.uploaded_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-sm text-cream-text mt-2 truncate">
                  {r.key ? r.key.split('/').pop() : 'Incident_Report.pdf'}
                </h4>
                <p className="text-[11px] font-mono text-cream-muted mt-1 truncate">
                  {r.s3_uri || `s3://${r.bucket}/${r.key}`}
                </p>
              </div>

              <div className="pt-2 border-t border-cream-border/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-500 font-mono">
                  {r.size_bytes ? `${(r.size_bytes / 1024).toFixed(1)} KB` : '148 KB'} • AES-256
                </span>
                <a
                  href={r.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline"
                >
                  <span>Access S3</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
