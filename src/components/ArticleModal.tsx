import { useArticlePolling } from '../hooks/useArticlePolling';
import { AnalysisState } from './AnalysisState';
import { Modal } from './Modal';

/** Opens an article by id. Used by both the user list and the admin list. */
export function ArticleModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const poll = useArticlePolling(id);
  return (
    <Modal
      open={id !== null}
      onClose={onClose}
      title="Analysis"
      wide
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      <AnalysisState {...poll} />
    </Modal>
  );
}
