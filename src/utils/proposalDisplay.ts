import type { Payment, Proposal } from '../services/api';

export const getProposalBidangName = (proposal?: Proposal | null): string => {
  if (!proposal) return 'Tanpa bidang';

  return (
    proposal.bidangRef?.name
    || proposal.bidang
    || proposal.rkam?.bidangRef?.name
    || proposal.rkam?.bidang
    || proposal.rkam?.category?.name
    || proposal.rkam?.kategori
    || proposal.user?.bidang?.name
    || 'Tanpa bidang'
  );
};

export const getPaymentBidangName = (payment?: Payment | null): string => (
  getProposalBidangName(payment?.proposal)
);
