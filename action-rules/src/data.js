// ============================================================
// Data model, metadata, seed rules, and simple formatters
// ============================================================

// --- Condition properties ---
export const CONDITION_PROPERTIES = {
  'Email Analysis': [
    { key: 'analysis.verdict', label: 'Verdict', type: 'enum', values: ['malicious', 'suspicious', 'spam', 'phishing', 'graymail', 'clean'] },
    { key: 'analysis.severity', label: 'Severity', type: 'enum', values: ['HIGH', 'MEDIUM', 'LOW'] },
    { key: 'analysis.confidence', label: 'Confidence', type: 'number', min: 0, max: 100 },
  ],
  'Source': [
    { key: 'source_context.mode', label: 'Mode', type: 'enum', values: ['monitoring', 'inline', 'api'] },
    { key: 'sender.reputation', label: 'Sender Reputation', type: 'enum', values: ['trusted', 'unknown', 'blocklisted'] },
    { key: 'sender.authentication', label: 'Authentication', type: 'enum', values: ['spf_pass', 'spf_fail', 'dkim_pass', 'dkim_fail', 'dmarc_pass', 'dmarc_fail'] },
  ],
  'Content': [
    { key: 'attachment.type', label: 'Attachment Type', type: 'enum', values: ['executable', 'archive', 'document', 'image', 'none'] },
    { key: 'attachment.risk', label: 'Attachment Risk', type: 'enum', values: ['high', 'medium', 'low'] },
    { key: 'content.contains', label: 'Content Contains', type: 'text' },
  ],
  'Targeting': [
    { key: 'recipient.group', label: 'Recipient Group', type: 'enum', values: ['Executives', 'Finance', 'IT', 'All Users'] },
    { key: 'header.direction', label: 'Direction', type: 'enum', values: ['inbound', 'outbound', 'internal'] },
  ],
};

export const ALL_PROPERTIES = Object.values(CONDITION_PROPERTIES).flat();

export function getPropertyDef(key) {
  return ALL_PROPERTIES.find(p => p.key === key);
}

export function getOperatorsForType(type) {
  if (type === 'enum') return [{ value: 'is', label: 'is' }, { value: 'is_not', label: 'is not' }];
  if (type === 'number') return [{ value: 'greater_than', label: 'greater than' }, { value: 'less_than', label: 'less than' }, { value: 'equals', label: 'equals' }];
  return [{ value: 'contains', label: 'contains' }, { value: 'does_not_contain', label: 'does not contain' }];
}

// --- Action types ---
export const ACTION_TYPES = {
  'Delivery': [
    { key: 'quarantine', label: 'Quarantine', config: null },
    { key: 'deliver_junk', label: 'Deliver to junk', config: null },
    { key: 'deliver_inbox', label: 'Deliver to inbox', config: null },
    { key: 'block', label: 'Block / reject', config: null },
    { key: 'redirect', label: 'Redirect to address', config: 'email' },
  ],
  'Modify': [
    { key: 'add_banner', label: 'Add banner', config: 'banner' },
    { key: 'strip_attachments', label: 'Strip attachments', config: null },
    { key: 'tag', label: 'Tag / label', config: 'label' },
  ],
  'Notify': [
    { key: 'notify_recipient', label: 'Notify recipient', config: 'recipient_permissions' },
    { key: 'notify_admin', label: 'Notify admin', config: 'admin_message' },
  ],
};

export const ALL_ACTIONS = Object.values(ACTION_TYPES).flat();
const DELIVERY_ACTIONS = ACTION_TYPES['Delivery'].map(a => a.key);

export const RECIPIENT_PERMISSIONS = ['Report', 'Release to inbox', 'View details', 'Report as safe', 'Agree', 'Forward to admin'];

export function getActionDef(key) {
  return ALL_ACTIONS.find(a => a.key === key);
}

export function isDeliveryAction(key) {
  return DELIVERY_ACTIONS.includes(key);
}

// --- ID generator ---
let nextId = 100;
export function makeId() { return String(nextId++); }

// --- Formatters ---
export function titleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function conditionPillText(c) {
  const prop = getPropertyDef(c.property);
  const label = prop ? prop.label : titleCase(c.property.split('.').pop());
  const value = titleCase(String(c.value));
  return `${label}: ${value}`;
}

export function actionSummaryText(actions) {
  const parts = actions.map(a => {
    const def = getActionDef(a.type);
    if (!def) return a.type;
    let text = def.label;
    if (a.type === 'notify_recipient' && a.config?.permissions?.length) {
      text += ` · Allow: ${a.config.permissions.join(', ')}`;
    }
    return text;
  });
  return parts.join(' · ');
}

// --- Seed rules ---
export const SEED_RULES = [
  {
    id: '1', name: 'Quarantine Malicious Emails', description: 'Block malicious emails detected in inline mode with high severity.',
    enabled: true, stopOnMatch: true,
    conditions: [
      { id: 'c1', property: 'source_context.mode', operator: 'is', value: 'inline' },
      { id: 'c2', property: 'analysis.verdict', operator: 'is', value: 'malicious' },
      { id: 'c3', property: 'analysis.severity', operator: 'is', value: 'HIGH' },
    ],
    actions: [
      { id: 'a1', type: 'quarantine', config: {} },
      { id: 'a2', type: 'notify_recipient', config: { permissions: ['Report', 'Release to inbox', 'View details'] } },
    ],
  },
  {
    id: '2', name: 'Banner on Suspicious (Monitoring)', description: 'Add warning banner to suspicious emails in monitoring mode.',
    enabled: true, stopOnMatch: true,
    conditions: [
      { id: 'c4', property: 'source_context.mode', operator: 'is', value: 'monitoring' },
      { id: 'c5', property: 'analysis.verdict', operator: 'is', value: 'suspicious' },
    ],
    actions: [
      { id: 'a3', type: 'add_banner', config: { severity: 'warn', message: 'This email has been flagged as suspicious. Proceed with caution.' } },
      { id: 'a4', type: 'notify_recipient', config: { permissions: ['Report as safe', 'View details', 'Report'] } },
    ],
  },
  {
    id: '3', name: 'Deliver Spam to Junk', description: 'Route spam emails to junk folder.',
    enabled: true, stopOnMatch: true,
    conditions: [
      { id: 'c6', property: 'analysis.verdict', operator: 'is', value: 'spam' },
    ],
    actions: [
      { id: 'a5', type: 'deliver_junk', config: {} },
    ],
  },
  {
    id: '4', name: 'Block Executable Attachments', description: 'Block emails with executable attachments from unknown senders.',
    enabled: true, stopOnMatch: true,
    conditions: [
      { id: 'c7', property: 'attachment.type', operator: 'is', value: 'executable' },
      { id: 'c8', property: 'sender.reputation', operator: 'is', value: 'unknown' },
      { id: 'c9', property: 'header.direction', operator: 'is', value: 'inbound' },
    ],
    actions: [
      { id: 'a6', type: 'block', config: {} },
      { id: 'a7', type: 'notify_admin', config: { message: 'Blocked executable attachment from unknown sender.' } },
    ],
  },
  {
    id: '5', name: 'Phishing Alert — High Confidence', description: 'Quarantine high-confidence phishing attempts and alert admins.',
    enabled: true, stopOnMatch: false,
    conditions: [
      { id: 'c10', property: 'analysis.verdict', operator: 'is', value: 'phishing' },
      { id: 'c11', property: 'analysis.confidence', operator: 'greater_than', value: '90' },
    ],
    actions: [
      { id: 'a8', type: 'quarantine', config: {} },
      { id: 'a9', type: 'notify_admin', config: { message: 'High-confidence phishing detected.' } },
    ],
  },
  {
    id: '6', name: 'Tag Outbound PII', description: 'tag pii',
    enabled: true, stopOnMatch: true, isLegacy: true,
    conditions: [
      { id: 'c12', property: 'header.direction', operator: 'is', value: 'outbound' },
      { id: 'c13', property: 'content.contains', operator: 'contains', value: 'PII' },
    ],
    actions: [
      { id: 'a10', type: 'tag', config: { label: 'Contains PII' } },
      { id: 'a11', type: 'notify_admin', config: { message: 'Outbound email flagged for PII content.' } },
    ],
  },
  {
    id: '7', name: 'Graymail Info Banner', description: 'Show informational banner on graymail.',
    enabled: false, stopOnMatch: true,
    conditions: [
      { id: 'c14', property: 'analysis.verdict', operator: 'is', value: 'graymail' },
    ],
    actions: [
      { id: 'a12', type: 'add_banner', config: { severity: 'info', message: '' } },
    ],
  },
  {
    id: '8', name: 'Archive Risk Scan', description: 'Strip high-risk archive attachments and warn users.',
    enabled: false, stopOnMatch: true,
    conditions: [
      { id: 'c15', property: 'attachment.type', operator: 'is', value: 'archive' },
      { id: 'c16', property: 'attachment.risk', operator: 'is', value: 'high' },
    ],
    actions: [
      { id: 'a13', type: 'strip_attachments', config: {} },
      { id: 'a14', type: 'add_banner', config: { severity: 'warn', message: 'Attachments were removed due to high risk assessment.' } },
    ],
  },
];
