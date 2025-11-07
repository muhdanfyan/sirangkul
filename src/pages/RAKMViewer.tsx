import React, { useState } from 'react';
import { Eye, Download } from 'lucide-react';

const RAKMViewer: React.FC = () => {
  const [rakmFiles] = useState<{
    name: string;
    path: string;
  }[]>([
    {
      name: '01 - LAPORAN KEUANGAN KOMITE SD SEPT 2025 SESUAI REKENING.xlt',
      path: '/file/01 - LAPORAN KEUANGAN KOMITE SD SEPT 2025 SESUAI REKENING.xlt',
    },
    {
      name: 'FIX RKAM INFAK - Revisi TA 2025.pdf',
      path: '/file/FIX RKAM INFAK - Revisi TA 2025.pdf',
    },
    {
      name: 'LAP KEUANGAN BNI 1998986678 INFAK - SEPT 2025.pdf',
      path: '/file/LAP KEUANGAN BNI 1998986678 INFAK - SEPT 2025.pdf',
    },
    {
      name: 'LAP KEUANGAN BNI JARIAH 1998988778 - SEPT 2025.pdf',
      path: '/file/LAP KEUANGAN BNI JARIAH 1998988778 - SEPT 2025.pdf',
    },
    {
      name: 'LAP KEUANGAN BSI 7218155671 INFAK DAN JARIAH - SEPT 2025.pdf',
      path: '/file/LAP KEUANGAN BSI 7218155671 INFAK DAN JARIAH - SEPT 2025.pdf',
    },
    {
      name: 'RKAM JARIAH REVISI TA 2025.pdf',
      path: '/file/RKAM JARIAH REVISI TA 2025.pdf',
    },
    {
      name: 'RKAM PERUBAHAN-REVISI TA 2025 - 17092025.xls',
      path: '/file/RKAM PERUBAHAN-REVISI TA 2025 - 17092025.xls',
    },
    {
      name: 'SOP PELATIHAN SiRANGKUL.pdf',
      path: '/file/SOP PELATIHAN SiRANGKUL.pdf',
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-sirangkul.png" alt="SiRangkul Logo" className="h-10 w-10" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Lihat RAKM</h1>
          </div>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Kembali ke Login
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daftar File RAKM</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {rakmFiles.map((file, index) => (
              <li key={index} className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{file.name}</span>
                <div className="flex items-center space-x-4">
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </a>
                  <a
                    href={file.path}
                    download
                    className="flex items-center text-sm text-green-600 hover:text-green-800"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default RAKMViewer;