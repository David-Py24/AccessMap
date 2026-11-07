/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../../types/accessibility';
import { getTagIcon } from '../../utils/tagHelpers';
import { Badge } from '../ui/Badge';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface TagVotingListProps {
  location: LocationPin;
  onVoteTag: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAnnounce: (msg: string) => void;
}

export const TagVotingList: React.FC<TagVotingListProps> = ({
  location,
  onVoteTag,
  onAnnounce,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Accessibility Features & Community Verification
        </h3>
        <span className="text-xs text-slate-400">
          {location.tags.length} reported tags
        </span>
      </div>

      <div className="space-y-2.5">
        {location.tags.map((tag) => {
          const isVerified = tag.confirmations >= 2 && tag.confirmations > tag.disputes;
          return (
            <div
              key={tag.name}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                    {getTagIcon(tag.name)}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {tag.name}
                  </span>

                  {isVerified && (
                    <Badge variant="success" size="xs">
                      Community verified
                    </Badge>
                  )}

                  {tag.isAiSuggested && (
                    <Badge variant="ai-suggested" size="xs">
                      AI-suggested
                    </Badge>
                  )}
                </div>

                {tag.rating > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {tag.rating.toFixed(1)}★
                    </span>
                    <span>({tag.ratingCount} ratings)</span>
                  </div>
                )}
              </div>

              {/* Confirm & Dispute Voting Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    onVoteTag(location.id, tag.name, 'confirm');
                    onAnnounce(`You voted to confirm ${tag.name}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                    tag.userVoted === 'confirm'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Confirm this tag is accurate"
                  aria-label={`Confirm tag ${tag.name}. Currently has ${tag.confirmations} confirmations.`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                  <span className="font-mono text-[11px] opacity-80">
                    ({tag.confirmations})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onVoteTag(location.id, tag.name, 'dispute');
                    onAnnounce(`You voted to dispute ${tag.name}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                    tag.userVoted === 'dispute'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Dispute this tag (inaccurate or barrier exists)"
                  aria-label={`Dispute tag ${tag.name}. Currently has ${tag.disputes} disputes.`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Dispute</span>
                  <span className="font-mono text-[11px] opacity-80">
                    ({tag.disputes})
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

