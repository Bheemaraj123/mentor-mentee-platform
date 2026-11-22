import { toast } from 'sonner';
import { api } from '../services/api';
import {
  Mail,
  MessageCircle,
  Copy,
  Share2,
  X,
} from 'lucide-react';

interface ShareOptionsProps {
  open: boolean;
  reportId: number;
  reportTitle?: string;
  onClose: () => void;
  onShared?: () => void;
}

async function getShareLink(reportId: number): Promise<string> {
  const response = await api.get(`/reports/${reportId}/share-link`);
  const url = response.data?.share_url;
  if (!url) throw new Error('No share URL returned');
  return url;
}

export function ShareOptions({
  open,
  reportId,
  reportTitle,
  onClose,
  onShared,
}: ShareOptionsProps) {
  if (!open) return null;

  const handleShareWithMentee = async () => {
    try {
      await api.post(`/reports/${reportId}/share`, {});
      toast.success('Report shared', {
        description: 'The report has been shared with your mentee.',
      });
      onShared?.();
      onClose();
    } catch (shareError: any) {
      const detail =
        shareError?.response?.data?.detail ||
        shareError?.message ||
        'Failed to share report. Please try again.';
      toast.error('Failed to share report', { description: detail });
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = await getShareLink(reportId);
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied', {
        description: 'Anyone with the link can view this report.',
      });
    } catch (copyError: any) {
      const detail =
        copyError?.response?.data?.detail ||
        copyError?.message ||
        'Could not copy the share link.';
      toast.error('Failed to copy link', { description: detail });
    }
  };

  const handleWhatsApp = async () => {
    try {
      const url = await getShareLink(reportId);
      const text = encodeURIComponent(
        `Check out this report: ${reportTitle || 'Report'}\n${url}`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    } catch (whatsAppError: any) {
      const detail =
        whatsAppError?.response?.data?.detail ||
        whatsAppError?.message ||
        'Could not generate the share link.';
      toast.error('Failed to open WhatsApp', { description: detail });
    }
  };

  const handleEmail = async () => {
    try {
      const url = await getShareLink(reportId);
      const subject = encodeURIComponent(reportTitle || 'Shared Report');
      const body = encodeURIComponent(
        `Hi,\n\nI'm sharing the report "${reportTitle || 'Report'}" with you.\n\n${url}\n\nBest regards`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    } catch (emailError: any) {
      const detail =
        emailError?.response?.data?.detail ||
        emailError?.message ||
        'Could not generate the share link.';
      toast.error('Failed to open email', { description: detail });
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="preview-topbar" style={{ padding: '18px 22px 14px' }}>
          <div>
            <span className="section-kicker">Share report</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px' }}>
              {reportTitle || 'Report'}
            </h2>
          </div>
          <button
            className="icon-button modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="report-preview-layout" style={{ padding: '8px 22px 22px' }}>
          <div className="report-document" style={{ padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                className="dropdown-item"
                style={{ padding: '11px 12px' }}
                onClick={handleShareWithMentee}
              >
                <Share2 size={16} /> Share with mentee
              </button>

              <button
                className="dropdown-item"
                style={{ padding: '11px 12px' }}
                onClick={handleCopyLink}
              >
                <Copy size={16} /> Copy share link
              </button>

              <button
                className="dropdown-item"
                style={{ padding: '11px 12px' }}
                onClick={handleWhatsApp}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>

              <button
                className="dropdown-item"
                style={{ padding: '11px 12px' }}
                onClick={handleEmail}
              >
                <Mail size={16} /> Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}