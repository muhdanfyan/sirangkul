import React, { useState } from 'react';
import { Upload, FileText, DollarSign, Save, Send, CheckIcon, ChevronDown, X } from 'lucide-react';
import { Combobox as HeadlessCombobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'


interface Person {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

const people: Person[] = [
  { id: 1, name: 'Durward Reynolds', email: 'durward@example.com', avatar: 'DR' },
  { id: 2, name: 'Kenton Towne', email: 'kenton@example.com', avatar: 'KT' },
  { id: 3, name: 'Therese Wunsch', email: 'therese@example.com', avatar: 'TW' },
  { id: 4, name: 'Benedict Kessler', email: 'benedict@example.com', avatar: 'BK' },
  { id: 5, name: 'Katelyn Rohan', email: 'katelyn@example.com', avatar: 'KR' },
];

const ProposalSubmission: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    category: '',
    urgency: 'Normal'
  });

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [query, setQuery] = useState('');

  const filteredPeople =
    query === ''
      ? people
      : people.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase()) || 
                 person.email?.toLowerCase().includes(query.toLowerCase());
        });

  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();

    if (asDraft) {
      alert('Proposal berhasil disimpan sebagai draft');
    } else {
      alert('Proposal berhasil disubmit untuk review');
    }
  };

  const formatRupiah = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Proposal Baru</h1>
        <p className="text-gray-600 mt-1">Lengkapi form di bawah untuk membuat proposal baru</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>


              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <HeadlessCombobox value={selectedPerson} onChange={setSelectedPerson}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden bg-white text-left border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                      <ComboboxInput
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(person: Person) => person?.name || ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari assignee..."
                        aria-label="Search assignee"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {selectedPerson ? (
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPerson(null);
                              setQuery('');
                            }}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        <ComboboxButton className="text-gray-400 hover:text-gray-500">
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </ComboboxButton>
                      </div>
                    </div>
                    <ComboboxOptions 
                      className="absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                      anchor="bottom"
                    >
                      {filteredPeople.length === 0 && query !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          Tidak ditemukan
                        </div>
                      ) : (
                        filteredPeople.map((person) => (
                          <ComboboxOption
                            key={person.id}
                            value={person}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <div className="flex items-center">
                                  <span
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-sm font-medium mr-3`}
                                  >
                                    {person.avatar}
                                  </span>
                                  <div>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {person.name}
                                    </span>
                                    <span className={`block text-xs ${active ? 'text-blue-700' : 'text-gray-500'}`}>
                                      {person.email}
                                    </span>
                                  </div>
                                </div>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </div>
                </HeadlessCombobox>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Proposal *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan judul proposal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jelaskan detail proposal Anda"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Budget and Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Anggaran & Waktu</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anggaran yang Dibutuhkan *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget ? `Rp ${formatRupiah(formData.budget)}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData({ ...formData, budget: value });
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumen Pendukung</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Dokumen (RAB, TOR, dll.)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm text-gray-600">
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">Klik untuk upload</span>
                        <span> atau drag and drop file di sini</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PDF, DOC, XLS up to 10MB</p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                          <FileText className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Simpan Draft
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Proposal
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Panduan Pengisian</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pastikan judul proposal jelas dan spesifik</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Sertakan deskripsi lengkap dengan tujuan dan manfaat</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Upload dokumen pendukung seperti RAB dan TOR</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pastikan anggaran realistis dan sesuai kebutuhan</div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Alur Persetujuan</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>1. Verifikator</div>
              <div>2. Kepala Madrasah</div>
              <div>3. Komite Madrasah</div>
              <div>4. Bendahara</div>
            </div>
            <div className="mt-4 text-xs text-blue-700">
              Proposal akan melalui 4 tahap persetujuan sebelum dapat direalisasi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalSubmission;