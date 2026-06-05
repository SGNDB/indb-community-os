-- Align memory_reactions reaction types with feed post_reactions types
-- Old types: love, respect, nostalgia, important
-- New types: like, love, support, celebrate, insightful, sad

-- First, remove old reactions that don't map cleanly
delete from public.memory_reactions
where reaction_type not in ('like', 'love', 'support', 'celebrate', 'insightful', 'sad');

-- Drop the old CHECK constraint
alter table public.memory_reactions
drop constraint if exists memory_reactions_reaction_type_check;

-- Add the new CHECK constraint matching post_reactions
alter table public.memory_reactions
add constraint memory_reactions_reaction_type_check
check (reaction_type in ('like', 'love', 'support', 'celebrate', 'insightful', 'sad'));
