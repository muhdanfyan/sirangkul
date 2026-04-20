export const COMMITTEE_RKAM_SCOPE_BY_EMAIL: Record<string, string[]> = {
  // Isi mapping ini jika setiap akun komite hanya boleh melihat proposal
  // untuk jenis RKAM tertentu. Pencocokan dilakukan terhadap kategori RKAM,
  // nama kategori, item RKAM, dan judul proposal.
  //
  // Contoh:
  // 'sarana@komite.sirangkul.sch.id': ['Sarana Prasarana', 'Renovasi', 'Pengadaan'],
  // 'kurikulum@komite.sirangkul.sch.id': ['Kurikulum', 'Pelatihan'],
  //
  // Akun demo utama masih dibiarkan kosong agar tidak memutus alur yang sudah ada.
  'komite@madrasah.com': [],
};
