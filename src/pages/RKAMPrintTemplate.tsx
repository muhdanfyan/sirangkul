import React from 'react';
import { RKAM } from '../services/api';

interface RKAMPrintTemplateProps {
  data: RKAM[];
  tahun: number;
}

const RKAMPrintTemplate: React.FC<RKAMPrintTemplateProps> = ({ data, tahun }) => {
  const formatRawIDR = (num: number) => {
    if (num === 0) return '-';
    // Match the format "Rp 63.900.000"
    return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
  };

  // Group by category name
  const groupedData: Record<string, RKAM[]> = {};
  data.forEach(item => {
    const catName = item.category?.name || item.kategori || 'Uncategorized';
    if (!groupedData[catName]) {
      groupedData[catName] = [];
    }
    groupedData[catName].push(item);
  });

  const grandTotal = data.reduce((sum, item) => sum + item.pagu, 0);
  const totalBos = data.reduce((sum, item) => sum + item.dana_bos, 0);
  const totalKomite = data.reduce((sum, item) => sum + item.dana_komite, 0);

  return (
    <div id="rkam-print-area" className="hidden p-4 bg-white text-black font-serif text-[10px] leading-tight">
      {/* Header section with Logos */}
      <div className="flex items-center justify-between mb-2 border-b-2 border-double border-black pb-2">
         {/* Kemenag Logo */}
         <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo-kemenag.png" alt="Logo Kemenag" className="w-14 h-14 object-contain" />
         </div>
         
         <div className="flex-1 text-center px-4">
            <h1 className="text-xs font-bold uppercase tracking-tight">KEMENTERIAN AGAMA KOTA MAKASSAR</h1>
            <h2 className="text-sm font-extrabold uppercase mt-0.5 tracking-tighter">MADRASAH ALIYAH NEGERI 2 KOTA MAKASSAR</h2>
            <p className="text-[8px] mt-0.5 italic leading-none">Jl. Sultan Alauddin No. 105 Tlp. 0411-875500, Faximili 0411-875500 Makassar, 90221</p>
            <h3 className="text-[11px] font-bold uppercase mt-2 border-b-2 border-black inline-block px-4">RENCANA KEGIATAN DAN ANGGARAN MADRASAH (RKAM)</h3>
            <h4 className="text-[10px] font-bold uppercase mt-1">TAHUN ANGGARAN {tahun}</h4>
         </div>

         {/* MAN 2 Logo */}
         <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo-man2.png" alt="Logo MAN 2" className="w-14 h-14 object-contain" />
         </div>
      </div>

      {/* Main Table */}
      <table className="w-full border-collapse border-[1.5px] border-black text-[9px]">
        <thead>
          <tr className="bg-white">
            <th rowSpan={2} className="border border-black px-1 py-2 text-center w-8">NO.</th>
            <th rowSpan={2} className="border border-black px-1 py-2 text-center">URAIAN KEGIATAN</th>
            <th colSpan={3} className="border border-black px-1 py-1 text-center bg-gray-50 uppercase font-bold">RENCANA</th>
            <th colSpan={2} className="border border-black px-1 py-1 text-center bg-gray-50 uppercase font-bold">SUMBER DANA</th>
            <th rowSpan={2} className="border border-black px-1 py-2 text-center w-24 uppercase font-bold leading-none text-[8px]">ANGGARAN YANG TELAH DIKELUARKAN (ACC)</th>
            <th rowSpan={2} className="border border-black px-1 py-2 text-center w-24 uppercase font-bold text-[8px]">SISA ANGGARAN</th>
          </tr>
          <tr className="bg-white">
             <th className="border border-black px-1 py-1 text-center w-12 uppercase font-bold text-[8px]">VOLUME</th>
             <th className="border border-black px-1 py-1 text-center w-16 uppercase font-bold text-[8px]">SATUAN</th>
             <th className="border border-black px-1 py-1 text-center w-28 uppercase font-bold text-[8px]">JUMLAH</th>
             <th className="border border-black px-1 py-1 text-center w-28 bg-[#FFFF00] uppercase font-bold text-[8px]">BOS {tahun}</th>
             <th className="border border-black px-1 py-1 text-center w-28 bg-[#FFD1DC] uppercase font-bold text-[8px]">KOMITE</th>
          </tr>
          {/* Roman Numerals Header Row Row (I, II, III...) */}
          <tr className="bg-gray-50 font-bold text-[8px]">
             <th className="border border-black px-1 py-0.5 text-center italic">I</th>
             <th className="border border-black px-1 py-0.5 text-center italic">II</th>
             <th className="border border-black px-1 py-0.5 text-center italic">III</th>
             <th className="border border-black px-1 py-0.5 text-center italic">IV</th>
             <th className="border border-black px-1 py-0.5 text-center italic">V</th>
             <th className="border border-black px-1 py-0.5 text-center italic">VI</th>
             <th className="border border-black px-1 py-0.5 text-center italic">VII</th>
             <th className="border border-black px-1 py-0.5 text-center"></th>
             <th className="border border-black px-1 py-0.5 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([catName, items], catIdx) => {
            const catPagu = items.reduce((s, i) => s + i.pagu, 0);
            const catBos = items.reduce((s, i) => s + (i.dana_bos || 0), 0);
            const catKomite = items.reduce((s, i) => s + (i.dana_komite || 0), 0);
            
            return (
              <React.Fragment key={catName}>
                {/* Category Main Line */}
                <tr className="font-bold">
                  <td className="border border-black px-1 py-1 text-center">{catIdx + 1}</td>
                  <td className="border border-black px-1 py-1 uppercase">{catName} :</td>
                  <td className="border border-black px-1 py-1 text-center">1</td>
                  <td className="border border-black px-1 py-1 text-center font-normal">Tahun</td>
                  <td className="border border-black px-1 py-1 text-right">{formatRawIDR(catPagu)}</td>
                  <td className="border border-black px-1 py-1 text-right bg-[#FFFF00]">{formatRawIDR(catBos)}</td>
                  <td className="border border-black px-1 py-1 text-right bg-[#FFD1DC]">{formatRawIDR(catKomite)}</td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1"></td>
                </tr>
                {/* Individual Items */}
                {items.map((item, itemIdx) => (
                  <tr key={item.id}>
                    <td className="border border-black px-1 py-1 text-center">{itemIdx + 1}</td>
                    <td className="border border-black px-1 py-1 pl-4">{item.item_name}</td>
                    <td className="border border-black px-1 py-1 text-center">{item.volume}</td>
                    <td className="border border-black px-1 py-1 text-center font-normal">{item.satuan}</td>
                    <td className="border border-black px-1 py-1 text-right">{formatRawIDR(item.unit_price)}</td>
                    <td className="border border-black px-1 py-1 text-right">{formatRawIDR(item.pagu)}</td>
                    <td className="border border-black px-1 py-1 text-right">{item.dana_bos > 0 ? formatRawIDR(item.dana_bos) : '-'}</td>
                    <td className="border border-black px-1 py-1 text-right">{item.dana_komite > 0 ? formatRawIDR(item.dana_komite) : '-'}</td>
                    <td className="border border-black px-1 py-1"></td>
                  </tr>
                ))}
                {/* Sub Total for Category */}
                <tr className="font-bold bg-gray-50 italic">
                   <td className="border border-black px-1 py-1"></td>
                   <td className="border border-black px-1 py-1 text-center uppercase tracking-widest">SUB TOTAL</td>
                   <td className="border border-black px-1 py-1"></td>
                   <td className="border border-black px-1 py-1"></td>
                   <td className="border border-black px-1 py-1 text-right">{formatRawIDR(catPagu)}</td>
                   <td className="border border-black px-1 py-1 text-right bg-[#FFFF00]">{formatRawIDR(catBos)}</td>
                   <td className="border border-black px-1 py-1 text-right bg-[#FFD1DC]">{formatRawIDR(catKomite)}</td>
                   <td className="border border-black px-1 py-1"></td>
                   <td className="border border-black px-1 py-1"></td>
                </tr>
              </React.Fragment>
            );
          })}
          
          {/* Grand Total Row */}
          <tr className="font-bold bg-yellow-50 text-[10px]">
            <td colSpan={2} className="border border-black px-2 py-2 text-center uppercase tracking-widest">T O T A L</td>
            <td className="border border-black px-2 py-2 text-center"></td>
            <td className="border border-black px-2 py-2 text-center"></td>
            <td className="border border-black px-2 py-2 text-right">{formatRawIDR(grandTotal)}</td>
            <td className="border border-black px-2 py-2 text-right bg-[#FFFF00]">{formatRawIDR(totalBos)}</td>
            <td className="border border-black px-2 py-2 text-right bg-[#FFD1DC]">{formatRawIDR(totalKomite)}</td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Date and Signature section based on scan */}
      <div className="mt-4 text-[9px]">
         <div className="text-right mb-4 font-bold">
            Makassar, 26 Desember 2025
         </div>
         
         <div className="grid grid-cols-3 gap-0 border-t border-black pt-4">
            {/* Row 1 */}
            <div className="text-center h-28 flex flex-col justify-between p-2">
               <div>
                  <p className="font-bold border-b border-black inline-block px-1">Kesekretariatan / Kantor</p>
               </div>
               <div>
                  <div className="relative inline-block">
                     <div className="h-12" /> {/* Sign space */}
                     <p className="font-bold underline">Yuyun Miscashanti, S.E.</p>
                     <p className="text-[8px]">(Plt. Kaur. TU)</p>
                  </div>
               </div>
            </div>

            <div className="text-center h-28 flex flex-col justify-between p-2">
               {/* Empty / Middle Space */}
               <div />
               <div>
                   <p className="font-bold">Mengesahkan:</p>
                   <div className="h-12" />
                   <p className="font-bold underline">Dr. Hj. Darmawati S.Ag., M.Pd.</p>
                   <p className="text-[8px]">(Kamad MAN 2 Kota Makassar)</p>
               </div>
            </div>

            <div className="text-center h-28 flex flex-col justify-between p-2">
               <div />
               <div>
                  <div className="h-12" />
                  <p className="font-bold underline">Prof. Dr. H. Al Marjuni, M.Pd.I.</p>
                  <p className="text-[8px]">Ketua Komite</p>
               </div>
            </div>

            {/* Additional Signatories from the full 12 list if needed, 
                but based on UI space, we'll provide the main 3-4 visible in the scan main block */}
            <div className="text-center h-28 flex flex-col justify-between p-2 mt-4">
               <div>
                  <p className="font-bold border-b border-black inline-block px-1">Bidang Pendidikan dan Riset</p>
               </div>
               <div>
                  <p className="font-bold underline">Prof. Dr. Eng. Ir. Jalaluddin, S.T., M.T.</p>
                  <p className="text-[8px]">Kepala Bidang</p>
               </div>
            </div>

            <div className="text-center h-28 flex flex-col justify-between p-2 mt-4">
               <div>
                   <p className="font-bold border-b border-black inline-block px-1">Wakamad Kurikulum</p>
               </div>
               <div>
                  <p className="font-bold underline">Nursakinah, S.Pd., M.Pd.</p>
               </div>
            </div>

            <div className="text-center h-28 flex flex-col justify-between p-2 mt-4">
               <div>
                  <p className="font-bold border-b border-black inline-block px-1">Sekretaris Komite</p>
               </div>
               <div>
                  <p className="font-bold underline">Prof. dr. Firdaus Hamid, Ph.D.</p>
               </div>
            </div>
         </div>
         
         <div className="mt-8 text-center italic text-gray-400 border-t border-gray-100 pt-1">
            Dicetak melalui Sistem Informasi SiRangkul - Madrasah Aliyah Negeri 2 Kota Makassar
         </div>
      </div>
    </div>
  );
};

export default RKAMPrintTemplate;
