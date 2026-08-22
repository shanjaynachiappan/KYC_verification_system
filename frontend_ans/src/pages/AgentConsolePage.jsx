import React, { useState, useEffect, useRef } from 'react';
import { Inbox, Send, CheckCircle2, XCircle } from 'lucide-react';
import {
  listAgentSessions, claimAgentSession, submitAgentDecision,
  getAgentMessages, buildAgentWsUrl
} from '../services/api';
import '../styles/agent-kyc.css';
import VideoCallFrame from '../components/VideoCallFrame';
// Simple, unauthenticated demo console for a human agent to sit at.
// In production this would live behind its own agent-login/auth, separate
// from the applicant-facing app -- see notes at the bottom of this file.
export default function AgentConsolePage() {
  const [agentName, setAgentName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState('');
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  // Poll the waiting queue.
  useEffect(() => {
    if (!nameConfirmed) return;
    const refresh = () => listAgentSessions('waiting').then(setSessions);
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [nameConfirmed]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClaim = async (session) => {
    const claimed = await claimAgentSession(session.session_id, agentName);
    setActiveSession(claimed);

    const history = await getAgentMessages(claimed.session_id);
    setMessages(history);

    const ws = new WebSocket(buildAgentWsUrl(claimed.session_id, 'agent'));
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data]);
      }
    };
    wsRef.current = ws;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: draft.trim() }));
    setMessages((prev) => [...prev, { sender_role: 'agent', message: draft.trim(), sent_at: new Date().toISOString() }]);
    setDraft('');
  };

  const handleDecision = async (decision) => {
    if (!activeSession) return;
    await submitAgentDecision(activeSession.session_id, decision, notes);
    if (wsRef.current) wsRef.current.close();
    setActiveSession(null);
    setMessages([]);
    setNotes('');
  };

  if (!nameConfirmed) {
    return (
      <div className="fintech-layout">
        <div className="agent-shell">
          <div className="agent-card">
            <h2 className="agent-title">Agent Console</h2>
            <p className="agent-subtext">Enter your agent name to view the queue.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (agentName.trim()) setNameConfirmed(true);
              }}
            >
              <input
                className="agent-chat-input"
                type="text"
                placeholder="Agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <button type="submit" className="primary-action-btn agent-continue-btn">
                <span>Enter Console</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fintech-layout">
      <div className="agent-console-shell">
        <div className="agent-queue-panel">
          <h3><Inbox size={18} /> Waiting Queue</h3>
          {sessions.length === 0 && <p className="agent-subtext">No applicants waiting.</p>}
          {sessions.map((s) => (
            <div key={s.session_id} className="agent-queue-item">
              <div>
                <strong>User {s.user_id.slice(0, 8)}</strong>
                <p className="agent-subtext">{s.reason}</p>
              </div>
              <button className="primary-action-btn agent-claim-btn" onClick={() => handleClaim(s)}>
                Claim
              </button>
            </div>
          ))}
        </div>

        <div className="agent-card agent-console-chat">
          {!activeSession ? (
            <p className="agent-subtext">Claim a session from the queue to begin.</p>
          ) : (
            <>
              <h3>Reviewing User {activeSession.user_id.slice(0, 8)}</h3>
              <p className="agent-subtext">Reason: {activeSession.reason}</p>
              <div className="agent-video-panel">
                <VideoCallFrame roomUrl={activeSession.video_room_url} displayName={agentName}/>
              </div>
              <div className="agent-chat-window">
                {messages.map((m, i) => (
                  <div key={i} className={`agent-chat-bubble ${m.sender_role === 'agent' ? 'mine' : 'theirs'}`}>
                    <span className="agent-bubble-sender">{m.sender_role === 'agent' ? 'You' : 'Applicant'}</span>
                    <p>{m.message}</p>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <form className="agent-chat-input-row" onSubmit={handleSend}>
                <input
                  className="agent-chat-input"
                  type="text"
                  placeholder="Message the applicant..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="primary-action-btn agent-send-btn">
                  <Send size={16} />
                </button>
              </form>

              <input
                className="agent-chat-input"
                type="text"
                placeholder="Decision notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ marginTop: '12px' }}
              />
              <div className="agent-decision-row">
                <button className="primary-action-btn agent-approve-btn" onClick={() => handleDecision('approved')}>
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button className="primary-action-btn agent-reject-btn" onClick={() => handleDecision('rejected')}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// NOTE ON SCOPE: this console has no login and is reachable at /agent/console
// by anyone who knows the URL -- fine for a demo where you open it in a
// second browser tab to play the "agent" role, but it must sit behind real
// agent authentication (a separate login, role check, IP allowlist, etc.)
// before any real deployment.