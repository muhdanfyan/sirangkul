import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = process.env.SIRANGKUL_API_BASE_URL || 'http://127.0.0.1:8000/api';
const FRONTEND_BASE_URL = process.env.SIRANGKUL_FRONTEND_BASE_URL || 'http://localhost:5714';
const PASSWORD = process.env.SIRANGKUL_FLOW_PASSWORD || 'Password123!';
const RUNTIME_FILE = process.env.SIRANGKUL_FLOW_RUNTIME
  || fileURLToPath(new URL('../scratch/local-flow-runtime.json', import.meta.url));

let runtimeConfig = {};
if (existsSync(RUNTIME_FILE)) {
  runtimeConfig = JSON.parse(readFileSync(RUNTIME_FILE, 'utf8'));
}
const TITLE_PREFIX = process.env.SIRANGKUL_FLOW_TITLE_PREFIX
  || runtimeConfig.title_prefix
  || 'FLOW';

const fields = [
  { slug: 'pendidikan', name: 'Pendidikan', rkam: 'Flow Test RKAM Pendidikan' },
  { slug: 'humas', name: 'HUMAS', rkam: 'Flow Test RKAM HUMAS' },
  { slug: 'sarpras', name: 'Sarana dan Prasarana', rkam: 'Flow Test RKAM Sarana dan Prasarana' },
  { slug: 'sekretariat', name: 'Sekretariat Komite', rkam: 'Flow Test RKAM Sekretariat Komite' },
];

const cases = [
  { key: 'A', suffix: 'APPROVE', amount: 1000000, rejectAt: null },
  { key: 'B', suffix: 'REJECT-VERIFIKATOR', amount: 1250000, rejectAt: 'verifikator' },
  { key: 'C', suffix: 'REJECT-KOMITE', amount: 1500000, rejectAt: 'komite_madrasah' },
  { key: 'D', suffix: 'REJECT-KEPALA', amount: 1750000, rejectAt: 'kepala_madrasah' },
];

const wrongFieldPairs = [
  { target: 'pendidikan', wrong: 'humas' },
  { target: 'humas', wrong: 'sarpras' },
  { target: 'sarpras', wrong: 'sekretariat' },
  { target: 'sekretariat', wrong: 'pendidikan' },
];

const results = {
  health: [],
  setup: [],
  proposals: [],
  rbac: [],
  negative: [],
  failures: [],
};

const tokens = new Map();
const users = new Map();

for (const [email, token] of Object.entries(runtimeConfig.tokens ?? {})) {
  tokens.set(email, token);
}

function account(role, slug = null) {
  const runtimeEmail = slug
    ? runtimeConfig.accounts?.[role]?.[slug]
    : runtimeConfig.accounts?.[role];
  if (runtimeEmail) return runtimeEmail;

  if (role === 'kepala_madrasah') return 'kepala@madrasah.com';
  if (role === 'bendahara') return 'flowtest.bendahara@sirangkul.test';
  if (role === 'administrator') return 'flowtest.admin@sirangkul.test';
  if (role === 'pengusul') return `flowtest.pengusul.${slug}@sirangkul.test`;
  if (role === 'verifikator') return `flowtest.verifikator.${slug}@sirangkul.test`;
  if (role === 'komite_madrasah') return `flowtest.komite.${slug}@sirangkul.test`;
  throw new Error(`Unknown account role: ${role}`);
}

function recordFailure(scope, message, detail = undefined) {
  results.failures.push({ scope, message, detail });
}

function expect(condition, scope, message, detail = undefined) {
  if (!condition) {
    recordFailure(scope, message, detail);
    return false;
  }
  return true;
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function request(method, path, options = {}) {
  const {
    token,
    json,
    form,
    expected = [200],
    raw = false,
    baseUrl = API_BASE_URL,
  } = options;

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
  });

  if (raw) {
    if (!expected.includes(response.status)) {
      const body = await response.text();
      throw new Error(`${method} ${path} expected ${expected.join('/')} got ${response.status}: ${body.slice(0, 300)}`);
    }
    return response;
  }

  const body = await parseBody(response);
  if (!expected.includes(response.status)) {
    const rendered = typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body).slice(0, 500);
    throw new Error(`${method} ${path} expected ${expected.join('/')} got ${response.status}: ${rendered}`);
  }
  return { status: response.status, body, headers: response.headers };
}

async function tryRequest(method, path, options = {}) {
  try {
    return await request(method, path, options);
  } catch (error) {
    return { error };
  }
}

async function checkHealth() {
  const api = await tryRequest('GET', '/health');
  results.health.push({
    target: `${API_BASE_URL}/health`,
    ok: !api.error,
    status: api.status ?? null,
    detail: api.error?.message ?? api.body?.status,
  });
  if (api.error) recordFailure('health.api', 'Backend API health check gagal', api.error.message);

  const frontend = await fetch(`${FRONTEND_BASE_URL}/`).catch((error) => ({ error }));
  results.health.push({
    target: `${FRONTEND_BASE_URL}/`,
    ok: !frontend.error && frontend.status === 200,
    status: frontend.status ?? null,
    detail: frontend.error?.message ?? null,
  });

  const frontendApi = await fetch(`${FRONTEND_BASE_URL}/api/health`).catch((error) => ({ error }));
  const frontendApiOk = !frontendApi.error && frontendApi.status === 200;
  results.health.push({
    target: `${FRONTEND_BASE_URL}/api/health`,
    ok: frontendApiOk,
    status: frontendApi.status ?? null,
    detail: frontendApi.error?.message ?? 'Vite proxy API check',
  });
  if (!frontendApiOk) {
    recordFailure('health.frontend_proxy', 'Frontend proxy /api/health tidak mencapai backend API', {
      status: frontendApi.status ?? null,
    });
  }
}

async function login(email) {
  if (tokens.has(email)) {
    const token = tokens.get(email);
    if (!users.has(email)) {
      const { body } = await request('GET', '/auth/me', { token });
      users.set(email, body);
    }
    return token;
  }

  const { body } = await request('POST', '/auth/login', {
    json: { email, password: PASSWORD },
    expected: [200],
  });
  tokens.set(email, body.token);
  users.set(email, body.user);
  return body.token;
}

async function getRkamForField(field) {
  const runtimeRkam = runtimeConfig.rkams?.[field.slug];
  if (runtimeRkam?.id) return runtimeRkam;

  const token = await login(account('pengusul', field.slug));
  const { body } = await request('GET', `/rkam?no_paginate=1&search=${encodeURIComponent(field.rkam)}`, { token });
  const item = body.data.find((candidate) => candidate.item_name === field.rkam);
  if (!item) throw new Error(`RKAM not found for ${field.name}: ${field.rkam}`);
  return item;
}

function gzPdf(filename, label) {
  const source = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 0 >>
endobj
% ${filename} ${label}
%%EOF
`);
  return {
    originalName: filename,
    originalSize: source.length,
    blob: new Blob([gzipSync(source)], { type: 'application/gzip' }),
  };
}

async function uploadAttachments(token, proposalId, files) {
  const form = new FormData();
  for (const file of files) {
    form.append('files[]', file.blob, `${file.originalName}.gz`);
    form.append('original_names[]', file.originalName);
    form.append('mime_types[]', file.mimeType ?? 'application/pdf');
    form.append('file_sizes[]', String(file.originalSize));
    form.append('attachment_types[]', file.attachmentType);
  }

  const { body } = await request('POST', `/proposals/${proposalId}/attachments`, {
    token,
    form,
    expected: [201],
  });
  return body.data;
}

async function createMainAttachments(token, proposalId, field, flowCase, revision = false) {
  const caseName = flowCase.suffix.toLowerCase().replaceAll('-', '-');
  const suffix = revision ? `${caseName}-revisi` : caseName;
  return uploadAttachments(token, proposalId, [
    {
      ...gzPdf(`proposal-${field.slug}-${suffix}.pdf`, `${field.name} ${flowCase.key}`),
      attachmentType: 'proposal',
    },
    {
      ...gzPdf(`lpj-${field.slug}-${suffix}.pdf`, `${field.name} ${flowCase.key}`),
      attachmentType: 'lpj',
    },
  ]);
}

async function listAttachments(token, proposalId) {
  const { body } = await request('GET', `/proposals/${proposalId}/attachments`, { token });
  return body.data;
}

async function downloadAttachment(token, attachmentId, expectedStatus = 200) {
  const response = await request('GET', `/attachments/${attachmentId}/download`, {
    token,
    expected: [expectedStatus],
    raw: true,
  });
  if (expectedStatus !== 200) return response;

  await response.arrayBuffer();
  return {
    status: response.status,
    contentType: response.headers.get('content-type'),
    contentEncoding: response.headers.get('content-encoding'),
  };
}

async function downloadAllAttachments(token, proposalId, scope) {
  const attachments = await listAttachments(token, proposalId);
  expect(attachments.length === 2, scope, 'Proposal tidak memiliki tepat 2 attachment', {
    proposalId,
    count: attachments.length,
  });
  expect(
    attachments.some((item) => item.attachment_type === 'proposal') && attachments.some((item) => item.attachment_type === 'lpj'),
    scope,
    'Attachment proposal dan LPJ tidak lengkap',
    attachments.map((item) => ({ id: item.id, type: item.attachment_type, name: item.file_name })),
  );

  for (const attachment of attachments) {
    const download = await downloadAttachment(token, attachment.id);
    expect(download.status === 200, scope, `Download attachment ${attachment.attachment_type} gagal`, download);
    expect(download.contentType?.includes('application/pdf'), scope, 'Content-Type attachment bukan application/pdf', download);
    expect(download.contentEncoding === 'gzip', scope, 'Content-Encoding attachment bukan gzip', download);
  }
  return attachments;
}

async function showProposal(token, proposalId) {
  const { body } = await request('GET', `/proposals/${proposalId}`, { token });
  return body.data;
}

async function proposalListContains(token, proposalId, status) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  const { body } = await request('GET', `/proposals${suffix}`, { token });
  return body.data.some((item) => item.id === proposalId);
}

function getProposalFromApprovalBody(body) {
  return body.data?.proposal ?? body.data;
}

async function submitProposal(token, proposalId, scope) {
  const { body } = await request('POST', `/proposals/${proposalId}/submit`, { token });
  const proposal = body.data;
  expect(proposal.status === 'submitted', scope, 'Submit tidak menghasilkan status submitted', {
    status: proposal.status,
  });
  return proposal;
}

async function verifyProposal(token, proposalId, field, scope) {
  const visible = await proposalListContains(token, proposalId, 'submitted');
  expect(visible, scope, 'Proposal tidak terlihat di antrian Verifikator bidang yang sama', { proposalId });
  await downloadAllAttachments(token, proposalId, `${scope}.download.verifikator`);
  const { body } = await request('POST', `/proposals/${proposalId}/verify`, {
    token,
    json: { notes: `Verifikasi dokumen lengkap untuk ${field.name}` },
  });
  const proposal = body.data;
  expect(proposal.status === 'verified', scope, 'Verify tidak menghasilkan status verified', {
    status: proposal.status,
  });
  return proposal;
}

async function approveKomite(token, proposalId, field, scope) {
  const visible = await proposalListContains(token, proposalId, 'approved');
  expect(visible, scope, 'Proposal tidak terlihat di antrian Komite bidang yang sama', { proposalId });
  await downloadAllAttachments(token, proposalId, `${scope}.download.komite`);
  const { body } = await request('POST', `/proposals/${proposalId}/approve`, {
    token,
    json: { notes: `Komite menyetujui proposal ${field.name}` },
  });
  const proposal = getProposalFromApprovalBody(body);
  expect(proposal.status === 'final_approved', scope, 'Approve Komite tidak menghasilkan status final_approved', {
    status: proposal.status,
  });
  return proposal;
}

async function finalApprove(token, proposalId, scope) {
  const visible = await proposalListContains(token, proposalId, 'verified');
  expect(visible, scope, 'Proposal tidak terlihat untuk Kepala Madrasah', { proposalId });
  await downloadAllAttachments(token, proposalId, `${scope}.download.kepala`);
  const { body } = await request('POST', `/proposals/${proposalId}/final-approve`, {
    token,
    json: { notes: 'Disetujui Kepala Madrasah' },
  });
  const proposal = body.data;
  expect(proposal.status === 'approved', scope, 'Approve Kepala tidak menghasilkan status approved', {
    status: proposal.status,
  });
  return proposal;
}

async function processPayment(token, proposalId, field, scope) {
  const pending = await request('GET', '/payments/pending', { token });
  expect(
    pending.body.data.some((item) => item.id === proposalId),
    scope,
    'Proposal final_approved tidak muncul di pending payment',
    { proposalId },
  );
  await downloadAllAttachments(token, proposalId, `${scope}.download.bendahara`);

  const proof = gzPdf(`bukti-bayar-${field.slug}.pdf`, `Bukti bayar ${field.name}`);
  const form = new FormData();
  form.append('recipient_name', `Penerima ${field.name}`);
  form.append('recipient_account', `1234567890${field.slug.length}`);
  form.append('bank_name', 'Bank Test');
  form.append('payment_method', 'transfer');
  form.append('payment_reference', `REF-${field.slug}-${proposalId.slice(0, 8)}`);
  form.append('notes', `Pembayaran flow test ${field.name}`);
  form.append('payment_proof_file', proof.blob, `${proof.originalName}.gz`);
  form.append('proof_original_name', proof.originalName);
  form.append('proof_original_size', String(proof.originalSize));

  const { body } = await request('POST', `/payments/${proposalId}/process`, {
    token,
    form,
  });
  const paymentId = body.data.payment_id;
  expect(body.data.status === 'processing', scope, 'Process payment tidak menghasilkan status processing', body.data);

  const afterProcess = await showProposal(token, proposalId);
  expect(afterProcess.status === 'payment_processing', scope, 'Proposal tidak menjadi payment_processing', {
    status: afterProcess.status,
  });

  const proofResponse = await request('GET', `/payments/${paymentId}/download-proof`, {
    token,
    expected: [200],
    raw: true,
  });
  await proofResponse.arrayBuffer();
  expect(proofResponse.headers.get('content-encoding') === 'gzip', scope, 'Download bukti bayar tidak gzip', {
    contentEncoding: proofResponse.headers.get('content-encoding'),
  });

  const complete = await request('POST', `/payments/${paymentId}/complete`, {
    token,
    json: { admin_notes: 'Pembayaran selesai untuk flow test lokal' },
  });
  expect(complete.body.data.proposal_status === 'completed', scope, 'Complete payment tidak menghasilkan proposal completed', complete.body);

  const completed = await showProposal(token, proposalId);
  expect(completed.status === 'completed', scope, 'Status akhir proposal bukan completed', {
    status: completed.status,
  });
  expect(Boolean(completed.payment), scope, 'Ringkasan pembayaran tidak tampil di detail proposal', {
    proposalId,
  });
  return { paymentId, status: completed.status };
}

async function rejectProposal(token, proposalId, actorRole, field, scope) {
  const rejection = {
    verifikator: {
      reason: `Dokumen proposal belum memuat rincian kebutuhan bidang ${field.name}.`,
      suggestions: 'Lengkapi rincian kebutuhan, jadwal kegiatan, dan penanggung jawab sebelum diajukan ulang.',
    },
    komite_madrasah: {
      reason: `Anggaran belum sesuai prioritas komite untuk bidang ${field.name}.`,
      suggestions: 'Sesuaikan nominal, tambahkan dasar kebutuhan, dan ajukan ulang setelah revisi.',
    },
    kepala_madrasah: {
      reason: `Proposal belum selaras dengan prioritas madrasah untuk bidang ${field.name}.`,
      suggestions: 'Perjelas urgensi, indikator manfaat, dan dampak kegiatan sebelum diajukan ulang.',
    },
  }[actorRole];

  await downloadAllAttachments(token, proposalId, `${scope}.download.rejector`);
  const { body } = await request('POST', `/proposals/${proposalId}/reject`, {
    token,
    json: {
      rejection_reason: rejection.reason,
      improvement_suggestions: rejection.suggestions,
    },
  });
  const proposal = body.data;
  expect(proposal.status === 'rejected', scope, 'Reject tidak menghasilkan status rejected', {
    status: proposal.status,
  });
  expect(proposal.rejected_by_role === actorRole, scope, 'rejected_by_role tidak sesuai', {
    expected: actorRole,
    actual: proposal.rejected_by_role,
  });
  return proposal;
}

async function reviseAndResubmit(ownerToken, proposalId, field, flowCase, scope) {
  const rejected = await showProposal(ownerToken, proposalId);
  expect(rejected.status === 'rejected', scope, 'Pengusul tidak melihat proposal rejected', {
    status: rejected.status,
  });
  expect(Boolean(rejected.rejection_reason), scope, 'Alasan reject tidak tampil ke pengusul');
  expect(Boolean(rejected.improvement_suggestions), scope, 'Saran perbaikan tidak tampil ke pengusul');

  await request('PATCH', `/proposals/${proposalId}`, {
    token: ownerToken,
    json: {
      description: `${rejected.description ?? ''} Revisi lokal ${flowCase.key}`.trim(),
    },
  });

  const before = await listAttachments(ownerToken, proposalId);
  const uploaded = await createMainAttachments(ownerToken, proposalId, field, flowCase, true);
  const after = await listAttachments(ownerToken, proposalId);
  expect(after.length === 2, scope, 'Upload revisi tidak menyisakan tepat 2 attachment', {
    count: after.length,
  });
  expect(
    uploaded.every((item) => item.file_name.includes('revisi')),
    scope,
    'Nama file revisi tidak tercatat pada attachment baru',
    uploaded.map((item) => item.file_name),
  );
  expect(
    before.every((oldItem) => !after.some((newItem) => newItem.id === oldItem.id)),
    scope,
    'Attachment lama tidak terganti setelah upload ulang tipe yang sama',
    { before: before.map((item) => item.id), after: after.map((item) => item.id) },
  );
  await downloadAllAttachments(ownerToken, proposalId, `${scope}.download.owner.revision`);
  await submitProposal(ownerToken, proposalId, scope);
}

async function createProposalForCase(field, flowCase, rkam) {
  const ownerToken = await login(account('pengusul', field.slug));
  const title = `${TITLE_PREFIX}-${field.slug}-${flowCase.suffix}`;
  const today = new Date().toISOString().slice(0, 10);
  const { body } = await request('POST', '/proposals', {
    token: ownerToken,
    json: {
      rkam_id: rkam.id,
      title,
      description: `${field.name} ${flowCase.key} local flow scenario`,
      jumlah_pengajuan: flowCase.amount,
      urgency: 'Normal',
      start_date: today,
      end_date: today,
    },
    expected: [201],
  });

  const proposal = body.data;
  const scope = `${field.slug}.${flowCase.key}`;
  expect(proposal.status === 'draft', scope, 'Proposal baru tidak berstatus draft', {
    status: proposal.status,
  });

  await createMainAttachments(ownerToken, proposal.id, field, flowCase);
  await downloadAllAttachments(ownerToken, proposal.id, `${scope}.download.owner.draft`);
  await submitProposal(ownerToken, proposal.id, scope);

  return { proposalId: proposal.id, title, ownerToken };
}

async function runApprovalToCompletion(field, proposalId, scope, options = {}) {
  const verifikatorToken = await login(account('verifikator', field.slug));
  const komiteToken = await login(account('komite_madrasah', field.slug));
  const kepalaToken = await login(account('kepala_madrasah'));
  const bendaharaToken = await login(account('bendahara'));

  if (!options.skipVerify) {
    await verifyProposal(verifikatorToken, proposalId, field, scope);
  }
  if (!options.skipKepala) {
    await finalApprove(kepalaToken, proposalId, scope);
  }
  if (!options.skipKomite) {
    await approveKomite(komiteToken, proposalId, field, scope);
  }
  return processPayment(bendaharaToken, proposalId, field, scope);
}

async function runMainMatrix() {
  const rkamBySlug = new Map();
  for (const field of fields) {
    rkamBySlug.set(field.slug, await getRkamForField(field));
  }

  const created = new Map();

  for (const field of fields) {
    for (const flowCase of cases) {
      const scope = `${field.slug}.${flowCase.key}`;
      const row = {
        bidang: field.name,
        case: flowCase.key,
        proposalId: null,
        statusAkhir: null,
        title: `${TITLE_PREFIX}-${field.slug}-${flowCase.suffix}`,
      };

      try {
        const createdProposal = await createProposalForCase(field, flowCase, rkamBySlug.get(field.slug));
        row.proposalId = createdProposal.proposalId;
        created.set(`${field.slug}:${flowCase.key}`, createdProposal.proposalId);

        const verifikatorToken = await login(account('verifikator', field.slug));
        const komiteToken = await login(account('komite_madrasah', field.slug));
        const kepalaToken = await login(account('kepala_madrasah'));

        if (flowCase.rejectAt === 'verifikator') {
          await rejectProposal(verifikatorToken, createdProposal.proposalId, 'verifikator', field, scope);
          await reviseAndResubmit(createdProposal.ownerToken, createdProposal.proposalId, field, flowCase, scope);
          await runApprovalToCompletion(field, createdProposal.proposalId, scope);
        } else if (flowCase.rejectAt === 'komite_madrasah') {
          await verifyProposal(verifikatorToken, createdProposal.proposalId, field, scope);
          await finalApprove(kepalaToken, createdProposal.proposalId, scope);
          await rejectProposal(komiteToken, createdProposal.proposalId, 'komite_madrasah', field, scope);
          await reviseAndResubmit(createdProposal.ownerToken, createdProposal.proposalId, field, flowCase, scope);
          await runApprovalToCompletion(field, createdProposal.proposalId, scope);
        } else if (flowCase.rejectAt === 'kepala_madrasah') {
          await verifyProposal(verifikatorToken, createdProposal.proposalId, field, scope);
          await rejectProposal(kepalaToken, createdProposal.proposalId, 'kepala_madrasah', field, scope);
          await reviseAndResubmit(createdProposal.ownerToken, createdProposal.proposalId, field, flowCase, scope);
          await runApprovalToCompletion(field, createdProposal.proposalId, scope);
        } else {
          await runApprovalToCompletion(field, createdProposal.proposalId, scope);
        }

        const finalProposal = await showProposal(await login(account('pengusul', field.slug)), createdProposal.proposalId);
        row.statusAkhir = finalProposal.status;
        expect(finalProposal.status === 'completed', scope, 'Status akhir flow bukan completed', {
          status: finalProposal.status,
        });
      } catch (error) {
        recordFailure(scope, 'Flow proposal gagal dijalankan sampai akhir', error.message);
      }

      results.proposals.push(row);
      console.log(`${row.bidang} ${row.case}: ${row.proposalId ?? '-'} -> ${row.statusAkhir ?? 'FAILED'}`);
    }
  }

  return created;
}

async function assertForbidden(method, path, token, scope, message) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const ok = response.status === 403;
  if (!ok) {
    let body = '';
    try {
      body = (await response.text()).slice(0, 300);
    } catch {
      body = '';
    }
    recordFailure(scope, message, { expected: 403, actual: response.status, body });
  }
  return response.status;
}

async function runRbac(created) {
  for (const pair of wrongFieldPairs) {
    const targetField = fields.find((item) => item.slug === pair.target);
    const wrongField = fields.find((item) => item.slug === pair.wrong);
    const proposalId = created.get(`${pair.target}:A`);
    if (!proposalId) continue;

    const ownerToken = await login(account('pengusul', targetField.slug));
    const attachments = await listAttachments(ownerToken, proposalId);
    const attachmentId = attachments[0]?.id;

    for (const role of ['verifikator', 'komite_madrasah']) {
      const wrongToken = await login(account(role, wrongField.slug));
      const scope = `rbac.${targetField.slug}.${role}.${wrongField.slug}`;
      const visible = await proposalListContains(wrongToken, proposalId);
      if (visible) recordFailure(scope, 'Proposal bidang lain muncul di daftar role scoped', { proposalId });

      const detailStatus = await assertForbidden('GET', `/proposals/${proposalId}`, wrongToken, scope, 'Direct detail proposal bidang lain tidak ditolak 403');
      const listStatus = await assertForbidden('GET', `/proposals/${proposalId}/attachments`, wrongToken, scope, 'List attachment bidang lain tidak ditolak 403');
      const downloadStatus = attachmentId
        ? await assertForbidden('GET', `/attachments/${attachmentId}/download`, wrongToken, scope, 'Download attachment bidang lain tidak ditolak 403')
        : null;

      results.rbac.push({
        proposalBidang: targetField.name,
        wrongUser: `${role} ${wrongField.name}`,
        listVisible: visible,
        detailStatus,
        attachmentListStatus: listStatus,
        attachmentDownloadStatus: downloadStatus,
      });
    }
  }
}

async function createNegativeProposal(field, titleSuffix, status = 'draft') {
  const rkam = await getRkamForField(field);
  const ownerToken = await login(account('pengusul', field.slug));
  const today = new Date().toISOString().slice(0, 10);
  const { body } = await request('POST', '/proposals', {
    token: ownerToken,
    json: {
      rkam_id: rkam.id,
      title: `${TITLE_PREFIX}-${field.slug}-NEGATIVE-${titleSuffix}`,
      description: `Negative upload scenario ${titleSuffix}`,
      jumlah_pengajuan: 100000,
      urgency: 'Normal',
      start_date: today,
      end_date: today,
    },
    expected: [201],
  });

  if (status === 'submitted') {
    await createMainAttachments(ownerToken, body.data.id, field, { key: titleSuffix, suffix: `NEGATIVE-${titleSuffix}` });
    await submitProposal(ownerToken, body.data.id, `negative.${titleSuffix}`);
  } else if (status === 'rejected') {
    await createMainAttachments(ownerToken, body.data.id, field, { key: titleSuffix, suffix: `NEGATIVE-${titleSuffix}` });
    await submitProposal(ownerToken, body.data.id, `negative.${titleSuffix}`);
    await rejectProposal(
      await login(account('verifikator', field.slug)),
      body.data.id,
      'verifikator',
      field,
      `negative.${titleSuffix}.reject`,
    );
  }

  return { proposalId: body.data.id, ownerToken };
}

async function uploadExpectStatus(token, proposalId, files, expectedStatus, label) {
  const form = new FormData();
  for (const file of files) {
    form.append('files[]', file.blob, `${file.originalName}.gz`);
    form.append('original_names[]', file.originalName);
    form.append('mime_types[]', file.mimeType ?? 'application/pdf');
    form.append('file_sizes[]', String(file.originalSize));
    form.append('attachment_types[]', file.attachmentType);
  }

  const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });
  const bodyText = await response.text();
  const row = { label, expectedStatus, actualStatus: response.status };
  results.negative.push(row);
  if (response.status !== expectedStatus) {
    recordFailure(`negative.${label}`, 'Status validasi upload tidak sesuai', {
      expected: expectedStatus,
      actual: response.status,
      body: bodyText.slice(0, 300),
    });
  }
  return { response, bodyText };
}

async function runNegativeUploads() {
  const field = fields[0];

  const missingProposal = await createNegativeProposal(field, 'MISSING-PROPOSAL');
  await uploadExpectStatus(
    missingProposal.ownerToken,
    missingProposal.proposalId,
    [{ ...gzPdf('only-lpj.pdf', 'only LPJ'), attachmentType: 'lpj' }],
    422,
    'tanpa_file_proposal',
  );

  const missingLpj = await createNegativeProposal(field, 'MISSING-LPJ', 'rejected');
  await uploadExpectStatus(
    missingLpj.ownerToken,
    missingLpj.proposalId,
    [{ ...gzPdf('only-proposal.pdf', 'only proposal'), attachmentType: 'proposal' }],
    422,
    'tanpa_file_lpj_rejected',
  );

  const tooLarge = await createNegativeProposal(field, 'TOO-LARGE');
  const largeSource = Buffer.alloc(1048577, 'a');
  await uploadExpectStatus(
    tooLarge.ownerToken,
    tooLarge.proposalId,
    [{
      originalName: 'large-proposal.pdf',
      originalSize: largeSource.length,
      blob: new Blob([gzipSync(largeSource)], { type: 'application/gzip' }),
      attachmentType: 'proposal',
    }],
    422,
    'file_terlalu_besar',
  );

  const invalidExt = await createNegativeProposal(field, 'INVALID-EXT');
  await uploadExpectStatus(
    invalidExt.ownerToken,
    invalidExt.proposalId,
    [{
      originalName: 'malware.exe',
      originalSize: 12,
      blob: new Blob([gzipSync(Buffer.from('not an executable'))], { type: 'application/gzip' }),
      attachmentType: 'proposal',
      mimeType: 'application/x-msdownload',
    }],
    422,
    'ekstensi_tidak_valid',
  );

  const duplicate = await createNegativeProposal(field, 'DUPLICATE-TYPE');
  await uploadExpectStatus(
    duplicate.ownerToken,
    duplicate.proposalId,
    [
      { ...gzPdf('proposal-a.pdf', 'duplicate A'), attachmentType: 'proposal' },
      { ...gzPdf('proposal-b.pdf', 'duplicate B'), attachmentType: 'proposal' },
    ],
    422,
    'tipe_duplikat',
  );

  const submitted = await createNegativeProposal(field, 'AFTER-SUBMIT', 'submitted');
  await uploadExpectStatus(
    submitted.ownerToken,
    submitted.proposalId,
    [{ ...gzPdf('late-proposal.pdf', 'late upload'), attachmentType: 'proposal' }],
    422,
    'upload_setelah_submitted',
  );

  const notOwner = await createNegativeProposal(field, 'NOT-OWNER');
  await uploadExpectStatus(
    await login(account('verifikator', field.slug)),
    notOwner.proposalId,
    [{ ...gzPdf('verifikator-upload.pdf', 'not owner'), attachmentType: 'proposal' }],
    403,
    'upload_oleh_bukan_owner',
  );

  const deleteAfterSubmit = await createNegativeProposal(field, 'DELETE-AFTER-SUBMIT');
  await createMainAttachments(deleteAfterSubmit.ownerToken, deleteAfterSubmit.proposalId, field, {
    key: 'DELETE',
    suffix: 'NEGATIVE-DELETE-AFTER-SUBMIT',
  });
  const attachments = await listAttachments(deleteAfterSubmit.ownerToken, deleteAfterSubmit.proposalId);
  await submitProposal(deleteAfterSubmit.ownerToken, deleteAfterSubmit.proposalId, 'negative.delete_after_submit');
  const deleteResponse = await fetch(`${API_BASE_URL}/attachments/${attachments[0].id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${deleteAfterSubmit.ownerToken}`, Accept: 'application/json' },
  });
  results.negative.push({
    label: 'hapus_attachment_setelah_submitted',
    expectedStatus: 422,
    actualStatus: deleteResponse.status,
  });
  if (deleteResponse.status !== 422) {
    recordFailure('negative.hapus_attachment_setelah_submitted', 'Status delete attachment setelah submitted tidak sesuai', {
      expected: 422,
      actual: deleteResponse.status,
      body: (await deleteResponse.text()).slice(0, 300),
    });
  }
}

async function validateSetup() {
  for (const field of fields) {
    const roles = ['pengusul', 'verifikator', 'komite_madrasah'];
    for (const role of roles) {
      const email = account(role, field.slug);
      const token = await login(email);
      const user = users.get(email);
      expect(Boolean(token), 'setup.users', `Login gagal untuk ${email}`);
      expect(user?.bidang?.name === field.name, 'setup.users', `Bidang user ${email} tidak sesuai`, {
        expected: field.name,
        actual: user?.bidang?.name,
      });
    }
  }

  const kepalaToken = await login(account('kepala_madrasah'));
  const kepala = users.get(account('kepala_madrasah'));
  expect(Boolean(kepalaToken), 'setup.kepala', 'Login Kepala Madrasah gagal');
  expect(kepala?.bidang_id === null, 'setup.kepala', 'Kepala Madrasah flow test tidak global/bidang_id null', kepala);

  await login(account('bendahara'));
  await login(account('administrator'));
  results.setup.push({ checked: 'flowtest logins and bidang mapping', ok: true });
}

async function main() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Frontend: ${FRONTEND_BASE_URL}`);

  await checkHealth();
  await validateSetup();
  const created = await runMainMatrix();
  await runRbac(created);
  await runNegativeUploads();

  console.log('\nRingkasan proposal:');
  console.table(results.proposals.map((row) => ({
    Bidang: row.bidang,
    Case: row.case,
    ProposalID: row.proposalId,
    Status: row.statusAkhir,
  })));

  console.log('\nRBAC lintas bidang:');
  console.table(results.rbac);

  console.log('\nValidasi upload negatif:');
  console.table(results.negative);

  if (results.failures.length > 0) {
    console.log('\nFAILURES:');
    for (const failure of results.failures) {
      console.log(`- [${failure.scope}] ${failure.message}`);
      if (failure.detail !== undefined) {
        console.log(`  ${JSON.stringify(failure.detail).slice(0, 600)}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log('\nSemua pemeriksaan scenario lokal lulus.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
