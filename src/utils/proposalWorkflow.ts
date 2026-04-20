import type { User } from '../contexts/AuthContext';
import type { Proposal } from '../services/api';

const getUserBidangId = (user?: User | null) => user?.bidang?.id || user?.bidang_id || null;

const getProposalBidangId = (proposal: Proposal) => (
  proposal.bidangRef?.id
  || proposal.bidang_id
  || proposal.rkam?.bidangRef?.id
  || proposal.rkam?.bidang_id
  || proposal.rkam?.category?.id
  || proposal.rkam?.category_id
  || null
);

const isBidangScopedRole = (role?: string | null) => (
  role === 'Pengusul'
  || role === 'Verifikator'
  || role === 'Komite Madrasah'
  || role === 'Kepala Madrasah'
);

export const matchesProposalBidang = (user: User | null | undefined, proposal: Proposal) => {
  if (!user || !isBidangScopedRole(user.role)) {
    return true;
  }

  const userBidangId = getUserBidangId(user);
  const proposalBidangId = getProposalBidangId(proposal);

  return Boolean(userBidangId && proposalBidangId && userBidangId === proposalBidangId);
};

export const isProposalAwaitingApproval = (user: User | null | undefined, proposal: Proposal) => {
  if (!user || !matchesProposalBidang(user, proposal)) {
    return false;
  }

  switch (user.role) {
    case 'Verifikator':
      return proposal.status === 'submitted';
    case 'Komite Madrasah':
      return proposal.status === 'verified';
    case 'Kepala Madrasah':
      return proposal.status === 'approved';
    default:
      return false;
  }
};

export const canApproveProposalForUser = (user: User | null | undefined, proposal: Proposal | null | undefined) => {
  if (!user || !proposal) {
    return false;
  }

  return isProposalAwaitingApproval(user, proposal);
};

export const canRejectProposalForUser = (user: User | null | undefined, proposal: Proposal | null | undefined) => {
  if (!user || !proposal) {
    return false;
  }

  if (user.role === 'Bendahara') {
    return proposal.status === 'final_approved' || proposal.status === 'payment_processing';
  }

  return isProposalAwaitingApproval(user, proposal);
};

export const getApprovalAttentionCount = (user: User | null | undefined, proposals: Proposal[]) => {
  if (!user) {
    return 0;
  }

  return proposals.filter((proposal) => isProposalAwaitingApproval(user, proposal)).length;
};

export const getProposalAttentionCount = (user: User | null | undefined, proposals: Proposal[]) => {
  if (!user) {
    return 0;
  }

  switch (user.role) {
    case 'Pengusul':
      return proposals.filter((proposal) => proposal.status === 'draft' || proposal.status === 'rejected').length;
    case 'Bendahara':
      return proposals.filter((proposal) =>
        proposal.status === 'final_approved' || proposal.status === 'payment_processing',
      ).length;
    case 'Verifikator':
    case 'Komite Madrasah':
    case 'Kepala Madrasah':
      return getApprovalAttentionCount(user, proposals);
    default:
      return 0;
  }
};

export const filterProposalsForUserView = (user: User | null | undefined, proposals: Proposal[]) => {
  if (!user || !isBidangScopedRole(user.role)) {
    return proposals;
  }

  return proposals.filter((proposal) => matchesProposalBidang(user, proposal));
};
