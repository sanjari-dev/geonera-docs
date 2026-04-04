import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function InfrastructurePage() {
  return (
    <DocPage
      icon="settings_input_component"
      title="Infrastructure"
      subtitle="Infrastruktur berbasis Kubernetes untuk orkestrasi container yang scalable, dengan pendekatan real-time processing dan distributed systems untuk merespons kondisi pasar secara cepat."
      badge="Cloud"
      badgeColor="slate"
    >
      <Section title="Container Strategy">
        <CardGrid>
          <Card icon="view_in_ar" title="Docker — Containerization">
            Setiap microservice dikemas dalam Docker image yang immutable. Mendukung multi-arch build
            (amd64 + arm64). Images di-publish ke private container registry.
          </Card>
          <Card icon="hub" title="Kubernetes — Orchestration">
            Kubernetes mengelola deployment, scaling, health checking, dan self-healing semua service.
            Setiap service memiliki Deployment, Service, dan HorizontalPodAutoscaler (HPA) sendiri.
          </Card>
          <Card icon="device_hub" title="Helm — Package Management">
            Konfigurasi Kubernetes dikelola menggunakan Helm chart per service, memungkinkan
            parameterisasi per environment (dev, staging, production).
          </Card>
          <Card icon="sync_alt" title="ArgoCD — GitOps">
            Deploy ke production menggunakan pendekatan GitOps via ArgoCD. Setiap merge ke branch
            main secara otomatis men-sync state cluster ke desired state di Git repository.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Service Deployment Specs">
        <Table
          headers={['Service', 'Replicas (Prod)', 'CPU Request', 'Memory Request', 'HPA Max', 'Storage']}
          rows={[
            ['Go Ingest',       '2',  '200m',  '256Mi', '5',  'Ephemeral'],
            ['Rust Preprocess', '2',  '500m',  '512Mi', '8',  'Ephemeral'],
            ['Python TFT',      '2',  '4 CPU', '8Gi',   '4',  'Model volume 20Gi'],
            ['C# API',          '3',  '500m',  '512Mi', '10', 'Ephemeral'],
            ['Java JForex',     '1',  '1 CPU', '1Gi',   '2',  'Ephemeral (singleton)'],
            ['RabbitMQ',        '3',  '1 CPU', '2Gi',   '—',  'PVC 50Gi'],
            ['ClickHouse',      '3',  '4 CPU', '16Gi',  '—',  'PVC 2Ti'],
            ['PostgreSQL',      '1+1','2 CPU', '4Gi',   '—',  'PVC 100Gi (primary+replica)'],
          ]}
        />
      </Section>

      <Section title="Real-Time Processing Architecture">
        <InfoBox type="info">
          Geonera dirancang untuk latensi rendah dalam merespons perubahan pasar. Target: sinyal baru
          tersedia dalam <strong>&lt; 30 detik</strong> setelah candle M1 terbaru ditutup.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Stage', 'Target Latency', 'Komponen']}
            rows={[
              ['Tick ingest',           '< 100ms',  'Go service → ClickHouse'],
              ['Candle aggregation',    '< 500ms',  'Go service (setiap menit)'],
              ['Feature computation',   '< 2s',     'Rust service (per update M1)'],
              ['TFT inference',         '< 10s',    'Python GPU inference'],
              ['Signal classification', '< 500ms',  'C# + XGBoost/LightGBM'],
              ['Order submission',      '< 1s',     'Java JForex SDK'],
              ['Total pipeline',        '< 30s',    'End-to-end dari M1 close'],
            ]}
          />
        </div>
      </Section>

      <Section title="Environment Separation">
        <Table
          headers={['Environment', 'Tujuan', 'Data', 'Scale']}
          rows={[
            ['Development', 'Pengembangan lokal developer',       'Data historis sample', '1 replica/service'],
            ['Staging',     'Integration test & QA',               'Data historis lengkap', 'Minimal production-like'],
            ['Production',  'Live trading environment',            'Live + historis',       'Full HA spec'],
          ]}
        />
      </Section>

      <Section title="Kubernetes Manifest Example">
        <CodeBlock lang="yaml">{`# C# Signal Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: signal-service
  namespace: geonera-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: signal-service
  template:
    spec:
      containers:
        - name: signal-service
          image: registry.geonera.io/signal-service:v2.1.0
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2"
              memory: "2Gi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: signal-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: signal-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70`}</CodeBlock>
      </Section>
    </DocPage>
  )
}
