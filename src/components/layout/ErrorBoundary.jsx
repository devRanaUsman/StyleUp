import { Component } from "react";
import { Link } from "@/components/navigation";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Page error:", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container">
        <div className="empty">
          <div className="empty__icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></svg></div>
          <h2 className="h2">Something went wrong on our side.</h2>
          <p>The page couldn't load. Try refreshing, or head back to the homepage while we look into it.</p>
          <div className="empty__actions">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Refresh page</button>
            <Link to="/" className="btn btn--secondary" onClick={() => this.setState({ error: null })}>Back home</Link>
          </div>
        </div>
      </div>
    );
  }
}
