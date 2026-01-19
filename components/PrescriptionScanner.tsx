import React, { useState } from 'react';
import { analyzePrescriptionImage } from '../services/geminiService';
import { PrescriptionAnalysis } from '../types';
import { Upload, ScanLine, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PrescriptionScanner: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PrescriptionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setAnalysis(null); // Reset previous analysis
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    const result = await analyzePrescriptionImage(selectedImage);
    
    if (result) {
      setAnalysis(result);
    } else {
      setError("Impossible d'analyser l'image. Assurez-vous qu'elle est claire et lisible.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="p-6 h-full flex flex-col items-center overflow-y-auto">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Scanner d'Ordonnance</h2>
          <p className="text-gray-500 mt-2">Utilisez l'IA pour extraire automatiquement les médicaments d'une photo d'ordonnance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            {selectedImage ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img src={selectedImage} alt="Prescription" className="max-h-[300px] object-contain rounded-lg border border-gray-200" />
                <div className="mt-6 flex space-x-4">
                   <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    Changer
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <button 
                    onClick={handleScan}
                    disabled={isLoading}
                    className="px-6 py-2 bg-pharmacy-600 text-white rounded-lg hover:bg-pharmacy-700 flex items-center space-x-2 shadow-md transition disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ScanLine size={20} />}
                    <span>{isLoading ? 'Analyse...' : 'Analyser'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-pharmacy-50 rounded-full flex items-center justify-center mx-auto text-pharmacy-500">
                  <Upload size={32} />
                </div>
                <div>
                  <label className="cursor-pointer bg-pharmacy-600 text-white px-6 py-3 rounded-lg hover:bg-pharmacy-700 shadow-lg transition transform hover:-translate-y-1 block">
                    Télécharger une photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <p className="text-sm text-gray-400 mt-2">JPG, PNG supportés</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-pharmacy-600" />
              Résultats de l'analyse
            </h3>
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
                <Loader2 size={48} className="animate-spin text-pharmacy-500" />
                <p>Lecture de l'ordonnance en cours...</p>
              </div>
            )}

            {!isLoading && !analysis && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <ScanLine size={48} className="opacity-20 mb-2" />
                <p>Aucune analyse effectuée</p>
              </div>
            )}

            {error && (
               <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-lg p-4 text-center">
                <AlertCircle size={48} className="mb-2" />
                <p>{error}</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> Note de l'IA
                  </h4>
                  <p className="text-sm text-blue-700">{analysis.notes}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">Médicaments Identifiés</h4>
                  {analysis.medications.length === 0 ? (
                    <p className="text-gray-500 italic">Aucun médicament détecté.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.medications.map((med, idx) => (
                        <li key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg">
                          <CheckCircle size={20} className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-800">{med.name}</p>
                            {med.dosage && <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>}
                            {med.instructions && <p className="text-xs text-gray-500 italic mt-1">{med.instructions}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;