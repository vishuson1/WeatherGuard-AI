import React, { useState, useEffect } from 'react';
import {
  Database, UploadCloud, CheckCircle2, XCircle, AlertTriangle,
  FileText, Check, ShieldAlert, Layers
} from 'lucide-react';
import { DatasetInspectionResponse } from '../types';
import { api } from '../services/api';

export const DatasetsPage: React.FC = () => {
  const [inspection, setInspection] = useState<DatasetInspectionResponse | null>(null);
  const [datasetsList, setDatasetsList] = useState<any[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadExistingDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasetsList(data);
    } catch (err) {
      console.error('Failed to list datasets', err);
    }
  };

  useEffect(() => {
    loadExistingDatasets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      const res = await api.uploadDataset(file);
      setInspection(res);
      await loadExistingDatasets();
    } catch (err: any) {
      setUploadError(err.message || 'Dataset upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Dataset Ingestion &amp; Kaggle CSV Verification Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Automated structural inspection and 4-fold suitability validation for Weather Prediction, Error Prediction, Bust Classification, and Verification.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center backdrop-blur-md transition">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-950 flex items-center justify-center mx-auto text-cyan-400 border border-cyan-800">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Upload Historical Weather or NWP Verification CSV</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports Kaggle, ERA5 Reanalysis, SYNOP ground-truth station observations, and NWP operational model logs.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-lg shadow-cyan-600/20 transition">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Analyzing Dataset...' : 'Select CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {uploadError && (
            <div className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-xs">
              {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* Inspection Results Dashboard */}
      {inspection && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-5 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">Automated Dataset Report</span>
              <h3 className="text-base font-bold text-white font-mono">{inspection.filename}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                {inspection.rows.toLocaleString()} Rows
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                {inspection.columns} Columns
              </span>
            </div>
          </div>

          {/* 4-FOLD SUITABILITY VALIDATION BOX */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Four-Fold Task Suitability Assessment:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                inspection.suitability.weather_prediction
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div>
                  <span className="text-xs font-bold block">A. Weather Prediction</span>
                  <span className="text-[10px] opacity-80">Atmospheric Features</span>
                </div>
                {inspection.suitability.weather_prediction ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                inspection.suitability.forecast_error_prediction
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div>
                  <span className="text-xs font-bold block">B. Error Prediction</span>
                  <span className="text-[10px] opacity-80">Paired Fcst + Obs</span>
                </div>
                {inspection.suitability.forecast_error_prediction ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                inspection.suitability.forecast_bust_classification
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div>
                  <span className="text-xs font-bold block">C. Bust Classification</span>
                  <span className="text-[10px] opacity-80">Extreme Error Labels</span>
                </div>
                {inspection.suitability.forecast_bust_classification ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                inspection.suitability.historical_verification
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div>
                  <span className="text-xs font-bold block">D. Verification</span>
                  <span className="text-[10px] opacity-80">Temporal Consistency</span>
                </div>
                {inspection.suitability.historical_verification ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              </div>
            </div>
          </div>

          {/* Inspection Metadata Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 uppercase text-[10px]">Data Integrity &amp; Coverage:</span>
              <div className="space-y-1 text-slate-400">
                <div>Date Range: <span className="text-slate-200 font-mono">{inspection.date_range}</span></div>
                <div>Geographical: <span className="text-slate-200 font-mono">{inspection.geographical_coverage}</span></div>
                <div>Duplicate Records: <span className="text-slate-200 font-mono">{inspection.duplicate_records}</span></div>
                <div>Missing Columns: <span className="text-slate-200 font-mono">{Object.keys(inspection.missing_values).length}</span></div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 uppercase text-[10px]">Forecast / Observation Pairing:</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Paired Status:</span>
                  <span className={`font-semibold ${inspection.forecast_observation_paired ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inspection.forecast_observation_paired ? 'PAIRED VERIFICATION READY' : 'UNPAIRED OBSERVATIONS'}
                  </span>
                </div>
                {inspection.validation_messages.map((msg, i) => (
                  <p key={i} className="text-[11px] text-slate-400 leading-snug">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Detected Column Names */}
          <div>
            <span className="font-bold text-slate-300 uppercase text-[10px] block mb-2">Detected Column Schema ({inspection.column_names.length}):</span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950 rounded border border-slate-800">
              {inspection.column_names.map((col, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-800">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Datasets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-3">Active Reference Datasets</h3>
        <div className="divide-y divide-slate-800 text-xs">
          {datasetsList.map((ds) => (
            <div key={ds.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-medium text-slate-200">{ds.filename}</span>
                <span className="text-slate-400">({ds.rows} records, {ds.columns} features)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                ACTIVE BENCHMARK
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
