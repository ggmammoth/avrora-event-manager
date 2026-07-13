import { supabase, run } from './supabase.js';

export function getReactionsForComments(commentIds) {
  if (!commentIds.length) return Promise.resolve([]);
  return run(
    supabase
      .from('comment_reactions')
      .select('id, comment_id, user_id, reaction_type')
      .in('comment_id', commentIds),
  );
}

export const setCommentReaction = (commentId, userId, reactionType) => run(
  supabase
    .from('comment_reactions')
    .upsert(
      { comment_id: commentId, user_id: userId, reaction_type: reactionType },
      { onConflict: 'comment_id,user_id' },
    )
    .select()
    .single(),
);

export const removeCommentReaction = (commentId, userId) => run(
  supabase
    .from('comment_reactions')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId),
);
