// Renders a plugin's page for /$activityId/$ (catch-all route).
// The plugin receives everything after its id as `subPath` and owns its sub-views.
import { Suspense } from 'react';
import { useParams } from '@tanstack/react-router';
import { useRegistry } from '@/lib/plugin-system';

export function PluginPageHost() {
  const { activityId, _splat } = useParams({ from: '/$activityId/$' });
  const activity = useRegistry().activity.get(activityId);
  const Page = activity?.action.kind === 'route' ? activity.action.page : undefined;

  if (!Page || !activity) return <div className="empty">No activity called “{activityId}”.</div>;
  return (
    <>
      <title>{`${activity.title} · IDE`}</title>
      <Suspense fallback={<div className="empty">Loading…</div>}>
        <Page subPath={_splat ?? ''} />
      </Suspense>
    </>
  );
}
