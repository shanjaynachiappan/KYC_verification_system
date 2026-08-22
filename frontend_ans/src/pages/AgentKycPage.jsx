import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Send, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import { createAgentSession, getAgentSession, getAgentMessages, buildAgentWsUrl } from '../services/api';
import '../styles/agent-kyc.css';
import VideoCallFrame from '../components/VideoCallFrame';
export default function AgentKycPage() {
  const navigate = useNavigate();
  const { userId, selfieData } = useVerification();

  const [session, setSession] = useState(null);       // AgentSessionResponse
  const [messages, setMessages] = useState([]);        // [{sender_role, message, sent_at}]
  const [draft, setDraft] = useState('');
  const [connecting, setConnecting] = useState(true);
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);

  // 1. Create (or resume) the session, then open the WebSocket.
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!userId) return;
      const reason = selfieData?.reviewRequired ? 'face_liveness_borderline_score' : 'manual_review_requested';
      const sessionRes = await createAgentSession(userId, reason);
      if (cancelled) return;
      setSession(sessionRes);

      const historyRes = await getAgentMessages(sessionRes.session_id);
      if (cancelled) return;
      setMessages(historyRes);

      const ws = new WebSocket(buildAgentWsUrl(sessionRes.session_id, 'applicant'));
      ws.onopen = () => setConnecting(false);
      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.type === 'message') {
          setMessages((prev) => [...prev, data]);
        }
        if (data.type === 'presence' && data.role === 'agent' && data.event === 'joined') {
          // Refresh session so status flips from "waiting" to "in_progress" in the UI.
          getAgentSession(sessionRes.session_id).then(setSession);
        }
      };
      wsRef.current = ws;

      // Poll session status every few seconds as a fallback in case the
      // WebSocket presence event is missed (e.g. brief network blip),
      // and to detect when the agent submits a final decision.
      pollRef.current = setInterval(async () => {
        const latest = await getAgentSession(sessionRes.session_id);
        setSession(latest);
        if (latest.status === 'completed') {
          clearInterval(pollRef.current);
        }
      }, 4000);
    };

    start();
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: draft.trim() }));
    setMessages((prev) => [...prev, { sender_role: 'applicant', message: draft.trim(), sent_at: new Date().toISOString() }]);
    setDraft('');
  };

  const handleContinue = () => {
    navigate('/verify/review');
  };

  const status = session?.status;

  return (
    <div className="fintech-layout">
      <Header />
      <div className="agent-shell">
        <div className="agent-card">
          <div className="agent-header">
            <div className="agent-icon-wrapper">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="agent-title">Agent-Led Verification</h2>
              <p className="agent-subtext">
                Your face-match / liveness score needs a closer look. You're being connected
                to a live compliance agent for manual verification.
              </p>
            </div>
          </div>

          {status === 'waiting' && (
            <div className="agent-status-strip waiting">
              <Clock size={16} />
              <span>Waiting for the next available agent...</span>
            </div>
          )}
          {status === 'in_progress' && (
            <div className="agent-status-strip active">
              <UserCheck size={16} />
              <span>Connected with {session?.agent_name || 'an agent'}. Chat below.</span>
            </div>
          )}
          {status === 'completed' && (
            <div className={`agent-status-strip ${session?.decision === 'approved' ? 'approved' : 'rejected'}`}>
              {session?.decision === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>
                Review {session?.decision === 'approved' ? 'approved' : 'rejected'} by {session?.agent_name || 'the agent'}.
                {session?.notes ? ` "${session.notes}"` : ''}
              </span>
            </div>
          )}
          <div className="agent-video-panel">
            <VideoCallFrame roomUrl={session?.video_room_url} displayName="You" />
          </div>
        
          <div className="agent-chat-window">
            {connecting && messages.length === 0 && (
              <p className="agent-subtext" style={{ textAlign: 'center' }}>Connecting to chat...</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`agent-chat-bubble ${m.sender_role === 'applicant' ? 'mine' : 'theirs'}`}>
                <span className="agent-bubble-sender">{m.sender_role === 'applicant' ? 'You' : (session?.agent_name || 'Agent')}</span>
                <p>{m.message}</p>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {status !== 'completed' && (
            <form className="agent-chat-input-row" onSubmit={handleSend}>
              <input
                className="agent-chat-input"
                type="text"
                placeholder="Type a message to the agent..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={status !== 'in_progress'}
              />
              <button type="submit" className="primary-action-btn agent-send-btn" disabled={status !== 'in_progress'}>
                <Send size={16} />
              </button>
            </form>
          )}

          {status === 'completed' && (
            <button className="primary-action-btn agent-continue-btn" onClick={handleContinue}>
              <span>Continue to Final Review</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}