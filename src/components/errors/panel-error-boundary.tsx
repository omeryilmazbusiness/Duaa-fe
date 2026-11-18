"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorPanel } from "@/components/errors/error-panel";

interface Props {
  /** Changing this (workspace or tab) clears a previous failure so the next screen gets a fresh try. */
  resetKey: string;
  children: ReactNode;
}

interface State {
  error: unknown;
  failedKey: string | null;
}

/** Keeps one broken screen from blanking the whole manager shell. */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null, failedKey: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (state.error && state.failedKey !== null && state.failedKey !== props.resetKey) {
      return { error: null, failedKey: null };
    }
    if (state.error && state.failedKey === null) return { failedKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("manager panel failed", error, info.componentStack);
  }

  private retry = () => this.setState({ error: null, failedKey: null });

  render() {
    if (this.state.error) return <ErrorPanel error={this.state.error} onRetry={this.retry} />;
    return this.props.children;
  }
}
