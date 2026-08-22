import React, { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

// Wraps Daily.co's prebuilt call UI (camera/mic controls, connection
// states, reconnect handling all included) into a single embeddable
// component. Both AgentKycPage.jsx (applicant) and AgentConsolePage.jsx
// (agent) render this with the same roomUrl -- Daily connects them into
// the same call automatically.
export default function VideoCallFrame({ roomUrl, displayName }) {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: false,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: 'var(--radius-md)',
      },
    });
    callFrameRef.current = callFrame;

    callFrame.join({ url: roomUrl, userName: displayName || 'Participant' });

    return () => {
      callFrame.leave();
      callFrame.destroy();
      callFrameRef.current = null;
    };
  }, [roomUrl, displayName]);

  if (!roomUrl) {
    return (
      <div className="agent-video-placeholder">
        <p>Video call isn't configured for this deployment yet -- continuing with chat only.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="agent-video-container" />;
}