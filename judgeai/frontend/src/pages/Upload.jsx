import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload as UploadIcon, FileText, Loader2, FileCheck2 } from 'lucide-react';
import mockData from '../mock/sampleExtraction.json';

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:8000/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/review', { state: { extractionData: response.data } });
    } catch (error) {
      console.log("Backend failed or not ready, using mock data", error);
      // Fallback to mock data
      setTimeout(() => {
        navigate('/review', { state: { extractionData: mockData } });
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-200">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 transform transition-all">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <FileCheck2 className="mx-auto h-12 w-12 text-blue-100 mb-3 relative z-10" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight relative z-10">JudgeAI</h1>
          <p className="text-blue-100 mt-2 text-lg font-medium relative z-10">Automated Legal Data Extraction</p>
        </div>
        
        <div className="p-8 sm:p-10">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-2 flex justify-center rounded-2xl border-3 border-dashed px-6 py-14 transition-all duration-300 ease-in-out cursor-pointer relative overflow-hidden group ${
              isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-slate-100'
            }`}
          >
            <div className="text-center">
              {file ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="bg-blue-100 p-4 rounded-full mb-4 shadow-inner">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                    className="mt-4 text-sm px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="bg-slate-200/50 p-4 rounded-full mb-5 group-hover:bg-blue-100 transition-colors duration-300">
                     <UploadIcon className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" aria-hidden="true" />
                  </div>
                  <div className="mt-2 flex text-lg leading-6 text-slate-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500 transition-colors focus-within:outline-none"
                    >
                      <span>Click to upload</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                    </label>
                    <p className="pl-2">or drag and drop</p>
                  </div>
                  <p className="text-sm leading-5 text-slate-400 font-medium mt-3">PDF files up to 10MB</p>
                </div>
              )}
            </div>
            {/* Make the whole div clickable to upload if no file is selected */}
            {!file && <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>}
          </div>
          
          <div className="mt-10">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-lg font-bold text-white transition-all duration-300 ${
                !file || loading 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/50'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={24} strokeWidth={3} /> Extracting Data...
                </span>
              ) : (
                'Extract Document Data'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
