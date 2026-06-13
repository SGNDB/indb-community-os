'use client';

import { Check, Gift, HandHeart, Loader2, MapPin, Pencil, Share2, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  acceptFadlaRequestAction,
  archiveFadlaItemAction,
  completeFadlaItemAction,
  confirmFadlaCollectionAction,
  confirmFadlaHandoverAction,
  declineFadlaRequestAction,
  deleteFadlaItemAction,
  requestFadlaItemAction,
  shareCommunityShareAction,
} from '@/app/[locale]/server-actions';
import { UserAvatar } from '@/components/layout/user-avatar';
import { MediaCarousel } from '@/components/media/media-carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils/cn';
import type { FadlaWithOwner } from '@/types/database';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍲',
  clothes: '👕',
  books: '📚',
  school_supplies: '🎒',
  furniture: '🪑',
  tools: '🧰',
  electronics: '💻',
  medical: '🩺',
  household: '🏠',
  other: '📦',
};

const URGENCY_STYLE: Record<string, string> = {
  urgent:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50',
  this_week:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/50',
  no_urgency:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50',
};

const STATUS_STYLE: Record<string, string> = {
  published:
    'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600',
  requested:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50',
  reserved:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/50',
  collected:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50',
  completed:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50',
  archived:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const REQUEST_STATUS_STYLE: Record<string, string> = {
  pending:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50',
  accepted:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50',
  declined:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50',
  cancelled:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const PRIMARY_ACTION_CLASS =
  'bg-[#ED2124] text-white shadow-sm hover:bg-[#d81e21] hover:text-white border border-[#ED2124]';

const DANGER_OUTLINE_ACTION_CLASS =
  'border border-[#ED2124]/40 bg-transparent text-[#ED2124] hover:bg-[#ED2124]/10 hover:text-[#c91d20]';

export function FadlaCard({
  item,
  currentUserId,
  locale,
  onEdit,
  compact = false,
}: {
  item: FadlaWithOwner;
  currentUserId?: string | null;
  locale: string;
  onEdit?: (item: FadlaWithOwner) => void;
  compact?: boolean;
}) {
  const t = useTranslations('Fadla');
  const feed = useTranslations('Feed');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [highlight, setHighlight] = useState(false);
  const [sharesCount, setSharesCount] = useState(item.shares_count ?? 0);
  const [requestState, setRequestState] = useState<'idle' | 'loading' | 'requested'>('idle');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targetItem = searchParams.get('item');
    if (targetItem !== item.id) return;
    const timer = window.setTimeout(() => {
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(true);
      window.setTimeout(() => setHighlight(false), 1500);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams, item.id]);

  async function handleRequest() {
    if (requestState !== 'idle') return;
    setRequestState('loading');
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('shareId', item.id);
    const result = await requestFadlaItemAction(formData);
    if (result.success) {
      toast.success(t('toasts.requested'));
      setRequestState('requested');
    } else {
      toast.error(result.error);
      setRequestState('idle');
    }
  }

  async function handleAccept(requestId: string) {
    if (actionLoading) return;
    setActionLoading(`accept-${requestId}`);
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('requestId', requestId);
    const result = await acceptFadlaRequestAction(formData);
    if (result.success) {
      toast.success(t('toasts.accepted'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  async function handleDecline(requestId: string) {
    if (actionLoading) return;
    setActionLoading(`decline-${requestId}`);
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('requestId', requestId);
    const result = await declineFadlaRequestAction(formData);
    if (result.success) {
      toast.success(t('toasts.declined'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  async function handleConfirmCollection() {
    if (actionLoading) return;
    setActionLoading('confirmCollection');
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('shareId', item.id);
    const result = await confirmFadlaCollectionAction(formData);
    if (result.success) {
      toast.success(t('toasts.collected'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  async function handleConfirmHandover() {
    if (actionLoading) return;
    setActionLoading('confirmHandover');
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('shareId', item.id);
    const result = await confirmFadlaHandoverAction(formData);
    if (result.success) {
      toast.success(t('toasts.handedOver'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  async function handleComplete() {
    if (actionLoading) return;
    setActionLoading('complete');
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('shareId', item.id);
    const result = await completeFadlaItemAction(formData);
    if (result.success) {
      toast.success(t('toasts.completed'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  async function handleArchive() {
    if (actionLoading) return;
    setActionLoading('archive');
    const formData = new FormData();
    formData.set('locale', locale);
    formData.set('shareId', item.id);
    const result = await archiveFadlaItemAction(formData);
    if (result.success) {
      toast.success(t('toasts.archived'));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setActionLoading(null);
  }

  const isOwner = currentUserId === item.owner_id;
  const ownerName = item.owner?.full_name ?? item.owner?.username ?? t('unknownOwner');
  const createdAt = new Date(item.created_at).toLocaleDateString(
    locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'short', day: 'numeric' },
  );
  const formatRequestDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US',
      { month: 'short', day: 'numeric' },
    );
  const categoryEmoji = CATEGORY_EMOJI[item.category] ?? '📦';
  const canBeRequested =
    (item.status === 'published' || item.status === 'requested') &&
    !isOwner &&
    !item.requested_by_current_user &&
    requestState !== 'requested';
  const hasPendingRequest = item.requested_by_current_user || requestState === 'requested';
  const acceptedRequest = (item.requests ?? []).find((r) => r.status === 'accepted');
  const acceptedRequesterName =
    acceptedRequest?.requester?.full_name ??
    acceptedRequest?.requester?.username ??
    t('unknownOwner');
  const isRecipient = acceptedRequest?.requester_id === currentUserId;
  const recipientConfirmedCollection = Boolean(acceptedRequest?.collected_at);
  const ownerConfirmedHandover = Boolean(acceptedRequest?.handed_over_at);
  const pendingRequests = (item.requests ?? []).filter((r) => r.status === 'pending');
  const ownerCanManageRequests =
    isOwner &&
    pendingRequests.length > 0 &&
    (item.status === 'published' || item.status === 'requested');

  return (
    <article
      ref={articleRef}
      id={`fadla-${item.id}`}
      className={cn(
        'overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_20px_50px_rgba(8,33,56,0.12)] transition-all duration-500',
        highlight && 'ring-2 ring-primary/40 bg-primary/5',
      )}
    >
      {item.images.length > 0 ? (
        <MediaCarousel
          items={item.images.map((image) => ({ url: image.url, type: 'image', alt: item.title }))}
          alt={item.title}
          aspectClassName={compact ? 'aspect-[4/3]' : 'aspect-[5/4]'}
          className="rounded-none border-0"
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center bg-linear-to-br from-primary/10 via-card to-emerald-100/60 dark:to-emerald-950/20',
            compact ? 'aspect-4/3' : 'aspect-5/4',
          )}
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background/80 text-primary shadow-sm">
              <Gift size={30} />
            </div>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {t('imagePlaceholder')}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                {categoryEmoji} {t(`categories.${item.category}`)}
              </Badge>
              {item.urgency_level !== 'no_urgency' && (
                <Badge className={cn('rounded-full px-3 py-1', URGENCY_STYLE[item.urgency_level])}>
                  {t(`urgency.${item.urgency_level}`)}
                </Badge>
              )}
              <Badge
                className={cn(
                  'rounded-full border px-3 py-1 text-[14px] font-medium leading-none',
                  STATUS_STYLE[item.status],
                )}
              >
                {t(`status.${item.status}`)}
              </Badge>
            </div>
            <h2 className="wrap-break-word text-xl font-bold leading-tight sm:text-2xl">
              {item.title}
            </h2>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{createdAt}</span>
        </div>

        <p className="wrap-break-word text-sm leading-6 text-foreground/85 sm:text-base">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {item.location ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <MapPin size={15} />
              {item.location}
            </span>
          ) : null}
          {item.quantity > 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              {t('qty')}: {item.quantity}
            </span>
          )}
        </div>

        {/* Owner + request/action area */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar
              label={ownerName}
              avatarUrl={item.owner?.avatar_url}
              className="h-10 w-10 shrink-0 text-xs"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{ownerName}</span>
              <span className="block text-xs text-muted-foreground">{t('sharedForHelp')}</span>
            </span>
          </div>

          {!isOwner && canBeRequested && (
            <Button
              type="button"
              disabled={requestState === 'loading'}
              onClick={handleRequest}
              className={cn('min-h-11 rounded-full px-5', PRIMARY_ACTION_CLASS)}
            >
              {requestState === 'loading' ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <HandHeart size={17} />
              )}
              {t('needThis')}
            </Button>
          )}

          {!isOwner && hasPendingRequest && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Check size={16} />
              {t('requested')}
            </span>
          )}

          {!isOwner &&
            isRecipient &&
            item.status === 'reserved' &&
            !recipientConfirmedCollection && (
              <Button
                type="button"
                disabled={actionLoading === 'confirmCollection'}
                onClick={handleConfirmCollection}
                className={cn('min-h-11 rounded-full px-5', PRIMARY_ACTION_CLASS)}
              >
                {actionLoading === 'confirmCollection' ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {t('confirmCollection')}
              </Button>
            )}

          {!isOwner &&
            isRecipient &&
            item.status === 'reserved' &&
            recipientConfirmedCollection && (
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300">
                <Check size={16} />
                {t('waitingHandover')}
              </span>
            )}

          {!isOwner &&
            isRecipient &&
            (item.status === 'collected' || item.status === 'archived') && (
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-950/30 dark:text-green-300">
                <Check size={16} />
                {t(item.status === 'archived' ? 'status.archived' : 'status.collected')}
              </span>
            )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="space-y-3 border-t border-border/60 pt-4">
            {/* Request management */}
            {ownerCanManageRequests && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  {t('requests')} ({pendingRequests.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="space-y-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          label={req.requester?.full_name ?? req.requester?.username ?? '?'}
                          avatarUrl={req.requester?.avatar_url}
                          className="h-10 w-10 shrink-0 text-[10px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                              {req.requester?.full_name ??
                                req.requester?.username ??
                                t('unknownOwner')}
                            </p>
                            <Badge
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[14px] font-medium leading-none',
                                REQUEST_STATUS_STYLE[req.status],
                              )}
                            >
                              {t(`requestStatus.${req.status}`)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRequestDate(req.created_at)}
                            {req.requester?.username ? ` · @${req.requester.username}` : ''}
                          </p>
                        </div>
                      </div>
                      {req.message && (
                        <p
                          className="whitespace-pre-wrap wrap-break-word rounded-xl bg-muted/50 px-3 py-2 text-sm leading-6 text-foreground/85"
                          dir="auto"
                        >
                          {req.message}
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          disabled={actionLoading === `accept-${req.id}`}
                          onClick={() => handleAccept(req.id)}
                          className={cn('min-h-11 rounded-full px-4', PRIMARY_ACTION_CLASS)}
                        >
                          {actionLoading === `accept-${req.id}` ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Check size={15} />
                          )}
                          {t('accept')}
                        </Button>
                        <Button
                          type="button"
                          disabled={actionLoading === `decline-${req.id}`}
                          onClick={() => handleDecline(req.id)}
                          className={cn('min-h-11 rounded-full px-4', DANGER_OUTLINE_ACTION_CLASS)}
                        >
                          {actionLoading === `decline-${req.id}` ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <X size={15} />
                          )}
                          {t('decline')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collected → Complete */}
            {item.status === 'reserved' && acceptedRequest && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3 text-sm dark:border-orange-900/50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    label={acceptedRequesterName}
                    avatarUrl={acceptedRequest.requester?.avatar_url}
                    className="h-9 w-9 shrink-0 text-[10px]"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-orange-900 dark:text-orange-100">
                      {t('reservedFor', { name: acceptedRequesterName })}
                    </p>
                    <p className="truncate text-xs text-orange-800/70 dark:text-orange-200/70">
                      {acceptedRequest.requester?.username
                        ? `@${acceptedRequest.requester.username}`
                        : t('unknownOwner')}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-orange-900/80 dark:text-orange-100/80">
                  {recipientConfirmedCollection ? t('recipientConfirmed') : t('waitingCollection')}
                </p>
                {recipientConfirmedCollection && !ownerConfirmedHandover && (
                  <Button
                    type="button"
                    disabled={actionLoading === 'confirmHandover'}
                    onClick={handleConfirmHandover}
                    className={cn('mt-3 w-full rounded-full', PRIMARY_ACTION_CLASS)}
                  >
                    {actionLoading === 'confirmHandover' ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {t('markHandedOver')}
                  </Button>
                )}
              </div>
            )}
            {item.status === 'collected' && (
              <Button
                type="button"
                disabled={actionLoading === 'complete'}
                onClick={handleComplete}
                className={cn('w-full rounded-full', PRIMARY_ACTION_CLASS)}
              >
                {actionLoading === 'complete' ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {t('completeAndArchive')}
              </Button>
            )}

            {/* Completed → Archive */}
            {item.status === 'completed' && (
              <Button
                type="button"
                disabled={actionLoading === 'archive'}
                onClick={handleArchive}
                className={cn('w-full rounded-full', DANGER_OUTLINE_ACTION_CLASS)}
              >
                {actionLoading === 'archive' ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : null}
                {t('archive')}
              </Button>
            )}

            {/* Edit / Delete (only for published items) */}
            {item.status === 'published' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(item)}
                  className="min-h-11 gap-1.5 rounded-full border-border bg-card"
                >
                  <Pencil size={15} />
                  {t('actions.edit')}
                </Button>
                <form
                  action={async (formData) => {
                    await deleteFadlaItemAction(formData);
                  }}
                >
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="shareId" value={item.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={cn('min-h-11 w-full rounded-full', DANGER_OUTLINE_ACTION_CLASS)}
                  >
                    <Trash2 size={15} />
                    {t('actions.delete')}
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Share */}
        <div className="flex border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={async () => {
              const url = `${window.location.origin}/${locale}/fadla?item=${item.id}`;
              let shared = false;
              if (typeof navigator !== 'undefined' && 'share' in navigator) {
                try {
                  await (navigator as Navigator).share({ url });
                  shared = true;
                } catch {
                  /* ignore */
                }
              }
              if (!shared) {
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success(feed('linkCopied'));
                } catch {
                  toast.error(feed('shareFailed'));
                  return;
                }
              }
              setSharesCount((c) => c + 1);
              const formData = new FormData();
              formData.set('shareId', item.id);
              const result = await shareCommunityShareAction(formData);
              if (!result.success && result.error === 'unauthorized') {
                setSharesCount((c) => Math.max(0, c - 1));
              }
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Share2 size={16} />
            <span className="tabular-nums">{sharesCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
