import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const features = [
  {
    title: 'AI-Driven Forecasting',
    description:
      'Temporal Fusion Transformer (TFT) models trained on multi-timeframe Forex and Gold data, served via Google Vertex AI for real-time predictions.',
  },
  {
    title: 'Real-Time Data Pipeline',
    description:
      'High-performance Rust tick engine ingests Dukascopy feeds, aggregates M1 candles, and computes indicators with sub-millisecond latency.',
  },
  {
    title: 'Event-Driven Microservices',
    description:
      'Decoupled services communicate over RabbitMQ. Each service (DataIngestion, CandleEngine, AIPredictor, TradeExecutor, RiskManager) is independently deployable.',
  },
  {
    title: 'Risk-First Architecture',
    description:
      'Every trade passes through configurable risk rules: position sizing, max drawdown limits, and circuit breakers before execution via Dukascopy JForex.',
  },
  {
    title: 'Multi-Timeframe Analysis',
    description:
      'Signals are validated across M1, M5, M15, H1, H4, and D1 timeframes. Conflicting signals are resolved by the Trading Engine before order submission.',
  },
  {
    title: 'Full Observability',
    description:
      'Structured logging, distributed tracing, and BigQuery analytics provide complete visibility into system behavior from tick ingestion to trade closure.',
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/introduction/overview">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/architecture/high-level-architecture"
            style={{ marginLeft: '1rem' }}
          >
            Architecture
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--4')} style={{ marginBottom: '2rem' }}>
      <div className="feature-card" style={{ height: '100%' }}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout title="Home" description="Geonera AI-Driven Trading System Documentation">
      <HomepageHeader />
      <main>
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>System Capabilities</h2>
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: 'var(--ifm-color-emphasis-100)', padding: '4rem 0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Quick Navigation</h2>
            <div className="row">
              {[
                { label: 'Introduction', path: '/docs/introduction/overview', desc: 'What Geonera is and how it works' },
                { label: 'Architecture', path: '/docs/architecture/high-level-architecture', desc: 'System design and service topology' },
                { label: 'Data Pipeline', path: '/docs/data-pipeline/data-sources', desc: 'Tick ingestion and candle processing' },
                { label: 'AI & Modeling', path: '/docs/ai-and-modeling/model-overview', desc: 'TFT model and prediction pipeline' },
                { label: 'Trading Engine', path: '/docs/trading-engine/signal-generation', desc: 'Signals, entries, exits, and execution' },
                { label: 'Risk Management', path: '/docs/risk-management/risk-rules', desc: 'Rules, sizing, and drawdown control' },
                { label: 'API Docs', path: '/docs/api-documentation/authentication', desc: 'REST endpoints and authentication' },
                { label: 'Glossary', path: '/docs/glossary', desc: 'Trading and system terminology' },
              ].map((item, idx) => (
                <div key={idx} className="col col--3" style={{ marginBottom: '1rem' }}>
                  <Link to={item.path} style={{ textDecoration: 'none' }}>
                    <div className="feature-card" style={{ cursor: 'pointer' }}>
                      <strong>{item.label}</strong>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
