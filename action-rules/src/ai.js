// ============================================================
// Rule derivation (natural language + code) and mocked AI calls
// ============================================================

import { getPropertyDef, getActionDef, isDeliveryAction, makeId } from './data';

// --- Natural language summary ---
export function generateNaturalLanguage(conditions, actions) {
  if (!conditions.length && !actions.length) return '';

  const condParts = conditions.map(c => {
    const prop = getPropertyDef(c.property);
    const label = prop ? prop.label.toLowerCase() : c.property;
    if (c.operator === 'is') return `${label} is "${c.value}"`;
    if (c.operator === 'is_not') return `${label} is not "${c.value}"`;
    if (c.operator === 'greater_than') return `${label} is greater than ${c.value}`;
    if (c.operator === 'less_than') return `${label} is less than ${c.value}`;
    if (c.operator === 'equals') return `${label} equals ${c.value}`;
    if (c.operator === 'contains') return `content contains "${c.value}"`;
    if (c.operator === 'does_not_contain') return `content does not contain "${c.value}"`;
    return `${label} ${c.operator} ${c.value}`;
  });

  const actionParts = actions.map(a => {
    const def = getActionDef(a.type);
    if (!def) return a.type;
    let text = def.label.toLowerCase();
    if (a.type === 'add_banner') text = `add a ${a.config?.severity || 'warn'} banner`;
    if (a.type === 'tag') text = `tag as "${a.config?.label || ''}"`;
    if (a.type === 'redirect') text = `redirect to ${a.config?.email || '...'}`;
    if (a.type === 'notify_recipient' && a.config?.permissions?.length) {
      text = `notify recipient (${a.config.permissions.join(', ')})`;
    }
    if (a.type === 'notify_admin') text = 'notify admin';
    return text;
  });

  const condStr = condParts.length ? `When ${condParts.join(' and ')}` : 'For all emails';
  const actStr = actionParts.length ? actionParts.join(', ') : 'no actions configured';
  return `${condStr}, ${actStr}.`;
}

// --- Rule code generation ---
export function generateRuleCode(conditions, actions) {
  const condParts = conditions.map(c => {
    if (c.operator === 'is') return `${c.property} == "${c.value}"`;
    if (c.operator === 'is_not') return `${c.property} != "${c.value}"`;
    if (c.operator === 'greater_than') return `${c.property} > ${c.value}`;
    if (c.operator === 'less_than') return `${c.property} < ${c.value}`;
    if (c.operator === 'equals') return `${c.property} == ${c.value}`;
    if (c.operator === 'contains') return `${c.property}.contains("${c.value}")`;
    if (c.operator === 'does_not_contain') return `!${c.property}.contains("${c.value}")`;
    return `${c.property} ${c.operator} "${c.value}"`;
  });

  const condStr = condParts.join(' && ') || 'true';

  const actParts = actions.map(a => {
    if (a.type === 'quarantine') return 'action.quarantine()';
    if (a.type === 'deliver_junk') return 'action.deliver("junk")';
    if (a.type === 'deliver_inbox') return 'action.deliver("inbox")';
    if (a.type === 'block') return 'action.block()';
    if (a.type === 'redirect') return `action.redirect("${a.config?.email || ''}")`;
    if (a.type === 'add_banner') return `action.banner("${a.config?.severity || 'warn'}")`;
    if (a.type === 'strip_attachments') return 'action.stripAttachments()';
    if (a.type === 'tag') return `action.tag("${a.config?.label || ''}")`;
    if (a.type === 'notify_recipient') return 'action.notifyRecipient()';
    if (a.type === 'notify_admin') return 'action.notifyAdmin()';
    return `action.${a.type}()`;
  });

  return `if (${condStr}) {\n  ${actParts.join(';\n  ')};\n}`;
}

// --- Simulated AI generation from a natural language prompt ---
export function simulateAIGeneration(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('malicious') && lower.includes('block')) {
    return {
      name: 'Block Malicious Emails',
      description: 'Blocks all emails identified as malicious before they reach the inbox.',
      conditions: [
        { id: makeId(), property: 'analysis.verdict', operator: 'is', value: 'malicious' },
      ],
      actions: [
        { id: makeId(), type: 'block', config: {} },
      ],
    };
  }

  if (lower.includes('malicious') && lower.includes('quarantine')) {
    return {
      name: 'Quarantine Malicious Emails',
      description: 'Quarantines high-severity malicious emails detected inline and notifies the recipient.',
      conditions: [
        { id: makeId(), property: 'source_context.mode', operator: 'is', value: 'inline' },
        { id: makeId(), property: 'analysis.verdict', operator: 'is', value: 'malicious' },
        { id: makeId(), property: 'analysis.severity', operator: 'is', value: 'HIGH' },
      ],
      actions: [
        { id: makeId(), type: 'quarantine', config: {} },
        { id: makeId(), type: 'notify_recipient', config: { permissions: ['Report', 'Release to inbox'] } },
      ],
    };
  }

  if (lower.includes('suspicious') && lower.includes('banner')) {
    return {
      name: 'Banner Suspicious Emails',
      description: 'Adds a warning banner to suspicious emails detected in monitoring mode and notifies the recipient.',
      conditions: [
        { id: makeId(), property: 'analysis.verdict', operator: 'is', value: 'suspicious' },
        { id: makeId(), property: 'source_context.mode', operator: 'is', value: 'monitoring' },
      ],
      actions: [
        { id: makeId(), type: 'add_banner', config: { severity: 'warn', message: 'This email was flagged as suspicious.' } },
        { id: makeId(), type: 'notify_recipient', config: { permissions: ['Report as safe', 'View details'] } },
      ],
    };
  }

  if (lower.includes('attachment') || lower.includes('executable')) {
    return {
      name: 'Block Executable Attachments',
      description: 'Blocks emails with executable attachments from unknown senders and alerts the admin.',
      conditions: [
        { id: makeId(), property: 'attachment.type', operator: 'is', value: 'executable' },
        { id: makeId(), property: 'sender.reputation', operator: 'is', value: 'unknown' },
      ],
      actions: [
        { id: makeId(), type: 'block', config: {} },
        { id: makeId(), type: 'notify_admin', config: { message: 'Blocked email with executable attachment from unknown sender.' } },
      ],
    };
  }

  // Fallback: generic monitoring rule
  return {
    name: 'Flag Malicious Emails',
    description: 'Flags malicious emails with a danger banner during monitoring and notifies the recipient.',
    conditions: [
      { id: makeId(), property: 'source_context.mode', operator: 'is', value: 'monitoring' },
      { id: makeId(), property: 'analysis.verdict', operator: 'is', value: 'malicious' },
    ],
    actions: [
      { id: makeId(), type: 'add_banner', config: { severity: 'danger', message: 'This email has been identified as potentially dangerous.' } },
      { id: makeId(), type: 'notify_recipient', config: { permissions: ['Report', 'View details'] } },
    ],
  };
}

// --- Simulated AI refinement of an existing rule ---
export function simulateAIRefine(prompt, currentConditions, currentActions) {
  const lower = prompt.toLowerCase();
  const newConditions = [...currentConditions];
  const newActions = [...currentActions];
  let name = null;
  let description = null;

  if (lower.includes('notify') && lower.includes('admin')) {
    const hasNotifyAdmin = newActions.some(a => a.type === 'notify_admin');
    if (!hasNotifyAdmin) {
      newActions.push({ id: makeId(), type: 'notify_admin', config: { message: 'A malicious email was blocked and requires review.' } });
    }
    name = 'Block Malicious Emails & Notify Admins';
    description = 'Blocks all emails identified as malicious and notifies the admin team for review.';
  } else if (lower.includes('add') || lower.includes('also')) {
    newConditions.push({ id: makeId(), property: 'analysis.severity', operator: 'is', value: 'HIGH' });
  } else if (lower.includes('change') || lower.includes('instead')) {
    if (newActions.length > 0) {
      const delivery = newActions.findIndex(a => isDeliveryAction(a.type));
      if (delivery >= 0) {
        newActions[delivery] = { ...newActions[delivery], type: 'quarantine', config: {} };
      }
    }
  } else {
    if (newConditions.length > 0) {
      const last = newConditions[newConditions.length - 1];
      const prop = getPropertyDef(last.property);
      if (prop && prop.type === 'enum' && prop.values.length > 1) {
        const currentIdx = prop.values.indexOf(last.value);
        const nextVal = prop.values[(currentIdx + 1) % prop.values.length];
        newConditions[newConditions.length - 1] = { ...last, value: nextVal };
      }
    }
  }

  return { conditions: newConditions, actions: newActions, name, description };
}

// --- Description suggestion (rule → human-readable description) ---
export function generateDescriptionSuggestion(conditions, actions) {
  const verdict = conditions.find(c => c.property === 'analysis.verdict')?.value;
  const direction = conditions.find(c => c.property === 'header.direction')?.value;
  const contentMatch = conditions.find(c => c.property === 'content.contains')?.value;
  const attachType = conditions.find(c => c.property === 'attachment.type')?.value;
  const hasBlock = actions.some(a => a.type === 'block');
  const hasQuarantine = actions.some(a => a.type === 'quarantine');
  const hasTag = actions.some(a => a.type === 'tag');
  const hasBanner = actions.some(a => a.type === 'add_banner');
  const hasNotifyAdmin = actions.some(a => a.type === 'notify_admin');

  if (direction === 'outbound' && contentMatch && hasTag) {
    return `Tags outbound emails containing ${contentMatch} so the security team is alerted to potential data leaks.`;
  }
  if (verdict === 'malicious' && hasBlock) {
    return `Blocks all emails identified as malicious${hasNotifyAdmin ? ' and notifies the admin team for review' : ''}.`;
  }
  if (verdict === 'malicious' && hasQuarantine) {
    return `Quarantines malicious emails so recipients can review before release.`;
  }
  if (verdict === 'phishing' && hasQuarantine) {
    return `Quarantines high-confidence phishing attempts and alerts the security team.`;
  }
  if (verdict === 'suspicious' && hasBanner) {
    return `Adds a warning banner to suspicious emails so recipients can review them with caution.`;
  }
  if (attachType && hasBlock) {
    return `Blocks emails containing ${attachType} attachments to prevent delivery of risky files.`;
  }
  // Generic fallback
  return `This rule automatically ${generateNaturalLanguage(conditions, actions)}`.replace('When', 'runs when');
}
