import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  GripVertical, Plus, ChevronDown, ChevronRight, Pencil, Trash2, X,
  Sparkles, ArrowRight, Shield, Code,
} from 'lucide-react';
import {
  CONDITION_PROPERTIES, ALL_PROPERTIES, ACTION_TYPES, RECIPIENT_PERMISSIONS,
  getPropertyDef, getOperatorsForType, getActionDef, isDeliveryAction,
  makeId, conditionPillText, actionSummaryText, SEED_RULES,
} from './data';
import {
  generateNaturalLanguage, generateRuleCode,
  simulateAIGeneration, simulateAIRefine, generateDescriptionSuggestion,
} from './ai';

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- Toast ---
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3 z-50 animate-fade-in">
      <span>{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// --- Skeleton Shimmer ---
function Skeleton({ className = '' }) {
  return <div className={`bg-slate-200 rounded animate-shimmer ${className}`} />;
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-3/4" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-5/6" />
      </div>
    </div>
  );
}

// --- Toggle Switch ---
function Toggle({ checked, onChange, size = 'default' }) {
  const dims = size === 'small' ? 'w-8 h-[18px]' : 'w-10 h-[22px]';
  const dot = size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const translate = size === 'small' ? 'translate-x-[15px]' : 'translate-x-[19px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex items-center rounded-full transition-colors duration-150 ease-out cursor-pointer ${dims} ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block ${dot} rounded-full bg-white shadow transform transition-transform duration-150 ease-out ${checked ? translate : 'translate-x-[3px]'}`} />
    </button>
  );
}

// --- Condition Card ---
function ConditionCard({ condition, onChange, onRemove, readOnly = false, animateIn = false }) {
  const prop = getPropertyDef(condition.property);
  const operators = prop ? getOperatorsForType(prop.type) : [];

  return (
    <div className={`flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 group ${animateIn ? 'animate-fade-in' : ''}`}>
      {readOnly ? (
        <>
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{prop?.label || condition.property}</span>
          <span className="text-xs text-slate-500">{condition.operator.replace(/_/g, ' ')}</span>
          <span className="text-xs font-medium text-slate-900 bg-blue-50 text-blue-700 px-2 py-1 rounded">{condition.value}</span>
        </>
      ) : (
        <>
          <select
            value={condition.property}
            onChange={e => {
              const newProp = getPropertyDef(e.target.value);
              const newOps = newProp ? getOperatorsForType(newProp.type) : [];
              const newVal = newProp?.type === 'enum' ? (newProp.values[0] || '') : '';
              onChange({ ...condition, property: e.target.value, operator: newOps[0]?.value || 'is', value: newVal });
            }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[140px]"
          >
            {Object.entries(CONDITION_PROPERTIES).map(([group, props]) => (
              <optgroup key={group} label={group}>
                {props.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </optgroup>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={e => onChange({ ...condition, operator: e.target.value })}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>

          {prop?.type === 'enum' ? (
            <select
              value={condition.value}
              onChange={e => onChange({ ...condition, value: e.target.value })}
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {prop.values.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          ) : prop?.type === 'number' ? (
            <input
              type="number"
              value={condition.value}
              min={prop.min} max={prop.max}
              onChange={e => onChange({ ...condition, value: e.target.value })}
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-900 font-medium w-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          ) : (
            <input
              type="text"
              value={condition.value}
              placeholder="keyword..."
              onChange={e => onChange({ ...condition, value: e.target.value })}
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-900 font-medium flex-1 min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          )}

          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

// --- Action Card ---
function ActionCard({ action, onChange, onRemove, readOnly = false, animateIn = false }) {
  const def = getActionDef(action.type);

  const renderConfig = () => {
    if (readOnly) {
      if (action.type === 'add_banner') {
        const colors = { info: 'bg-blue-50 text-blue-700', warn: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700' };
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${colors[action.config?.severity] || colors.warn}`}>
              {action.config?.severity || 'warn'}
            </span>
            {action.config?.message && <span className="text-xs text-slate-500 italic">"{action.config.message}"</span>}
          </div>
        );
      }
      if (action.type === 'notify_recipient' && action.config?.permissions?.length) {
        return (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {action.config.permissions.map(p => (
              <span key={p} className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p}</span>
            ))}
          </div>
        );
      }
      if (action.type === 'notify_admin' && action.config?.message) {
        return <p className="text-xs text-slate-500 italic mt-1.5">"{action.config.message}"</p>;
      }
      if (action.type === 'tag' && action.config?.label) {
        return <span className="text-xs text-slate-500 mt-1.5">Label: "{action.config.label}"</span>;
      }
      if (action.type === 'redirect' && action.config?.email) {
        return <span className="text-xs text-slate-500 mt-1.5">To: {action.config.email}</span>;
      }
      return null;
    }

    // Editable configs
    if (action.type === 'add_banner') {
      return (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1">
            {['info', 'warn', 'danger'].map(sev => (
              <button
                key={sev}
                onClick={() => onChange({ ...action, config: { ...action.config, severity: sev } })}
                className={`text-[11px] font-medium px-2.5 py-1 rounded capitalize transition-colors ${
                  action.config?.severity === sev
                    ? sev === 'info' ? 'bg-blue-600 text-white' : sev === 'warn' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={action.config?.message || ''}
            placeholder="Custom banner message (optional)"
            onChange={e => onChange({ ...action, config: { ...action.config, message: e.target.value } })}
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      );
    }

    if (action.type === 'notify_recipient') {
      const perms = action.config?.permissions || [];
      return (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {RECIPIENT_PERMISSIONS.map(p => (
            <label key={p} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={perms.includes(p)}
                onChange={e => {
                  const next = e.target.checked ? [...perms, p] : perms.filter(x => x !== p);
                  onChange({ ...action, config: { ...action.config, permissions: next } });
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              {p}
            </label>
          ))}
        </div>
      );
    }

    if (action.type === 'notify_admin') {
      return (
        <div className="mt-2">
          <input
            type="text"
            value={action.config?.message || ''}
            placeholder="Custom admin notification message (optional)"
            onChange={e => onChange({ ...action, config: { ...action.config, message: e.target.value } })}
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      );
    }

    if (action.type === 'tag') {
      return (
        <div className="mt-2">
          <input
            type="text"
            value={action.config?.label || ''}
            placeholder="Label text"
            onChange={e => onChange({ ...action, config: { ...action.config, label: e.target.value } })}
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      );
    }

    if (action.type === 'redirect') {
      return (
        <div className="mt-2">
          <input
            type="email"
            value={action.config?.email || ''}
            placeholder="redirect@example.com"
            onChange={e => onChange({ ...action, config: { ...action.config, email: e.target.value } })}
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg px-3 py-2.5 group ${animateIn ? 'animate-fade-in' : ''}`}>
      <div className="flex items-center justify-between">
        {readOnly ? (
          <span className="text-xs font-medium text-slate-700">{def?.label || action.type}</span>
        ) : (
          <select
            value={action.type}
            onChange={e => {
              const newDef = getActionDef(e.target.value);
              const defaultConfig = {};
              if (e.target.value === 'add_banner') defaultConfig.severity = 'warn';
              if (e.target.value === 'notify_recipient') defaultConfig.permissions = [];
              onChange({ ...action, type: e.target.value, config: defaultConfig });
            }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[160px]"
          >
            {Object.entries(ACTION_TYPES).map(([group, acts]) => (
              <optgroup key={group} label={group}>
                {acts.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        {!readOnly && (
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {renderConfig()}
    </div>
  );
}

// --- Rule Card (List View) ---
function RuleCard({ rule, index, onToggle, onEdit, onDelete, expanded, onToggleExpand, dragHandlers }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-4 flex items-center justify-between animate-fade-in">
        <p className="text-sm text-red-800">Delete <strong>{rule.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={() => { setConfirming(false); onDelete(rule.id); }} className="text-xs px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${rule.enabled ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50/50 opacity-50'} hover:border-slate-300`}
      {...dragHandlers}
    >
      {/* Collapsed content */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Drag handle */}
        <div className="mt-1.5 cursor-grab text-slate-400 hover:text-slate-600" draggable>
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{rule.name}</h3>
            {!rule.stopOnMatch && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Continues matching</span>
            )}
          </div>

          {rule.description && (
            <p className="text-xs text-slate-500">{rule.description}</p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <Toggle checked={rule.enabled} onChange={() => onToggle(rule.id)} size="small" />
          <button onClick={() => onEdit(rule.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setConfirming(true)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggleExpand(rule.id)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <div className={`overflow-hidden transition-all duration-200 ease-out ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 ml-7">
          {/* Rule Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              {generateNaturalLanguage(rule.conditions, rule.actions)}
            </p>
          </div>

          {/* Condition & Action Pills */}
          <div className="space-y-1 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {rule.conditions.map(c => (
                <span key={c.id} className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {conditionPillText(c)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{actionSummaryText(rule.actions)}</span>
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-3">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Conditions</h4>
            <div className="space-y-1.5">
              {rule.conditions.map((c, i) => (
                <div key={c.id}>
                  <ConditionCard condition={c} readOnly />
                  {i < rule.conditions.length - 1 && (
                    <div className="flex items-center my-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">AND</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Actions</h4>
            <div className="space-y-1.5">
              {rule.actions.map(a => (
                <ActionCard key={a.id} action={a} readOnly />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIEW: Rule List
// ============================================================

function RuleListView({ rules, onNavigateCreate, onNavigateEdit, onUpdateRules }) {
  const [expandedId, setExpandedId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const toggleRule = useCallback((id) => {
    onUpdateRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [rules, onUpdateRules]);

  const deleteRule = useCallback((id) => {
    onUpdateRules(rules.filter(r => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [rules, onUpdateRules, expandedId]);

  const handleDragStart = useCallback((idx) => {
    dragItem.current = idx;
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    setDragOverIndex(idx);
  }, []);

  const handleDrop = useCallback((idx) => {
    const from = dragItem.current;
    if (from === null || from === idx) { setDragOverIndex(null); return; }
    const next = [...rules];
    const [item] = next.splice(from, 1);
    next.splice(idx, 0, item);
    onUpdateRules(next);
    dragItem.current = null;
    setDragOverIndex(null);
  }, [rules, onUpdateRules]);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
    setDragOverIndex(null);
  }, []);

  if (rules.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Action Rules</h1>
          <button onClick={onNavigateCreate} className="flex items-center gap-1.5 border border-blue-600 text-blue-600 bg-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <Plus className="w-4 h-4" /> Add Action Rule
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <Shield className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-medium mb-1">No action rules configured</p>
          <p className="text-xs text-slate-400 mb-4">Create your first rule to start protecting your email.</p>
          <button onClick={onNavigateCreate} className="flex items-center gap-1.5 border border-blue-600 text-blue-600 bg-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <Plus className="w-4 h-4" /> Add Action Rule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Action Rules</h1>
        <button onClick={onNavigateCreate} className="flex items-center gap-1.5 border border-blue-600 text-blue-600 bg-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Action Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div key={rule.id}>
            {dragOverIndex === idx && (
              <div className="h-0.5 bg-blue-500 rounded-full my-1 animate-fade-in" />
            )}
            <RuleCard
              rule={rule}
              index={idx}
              expanded={expandedId === rule.id}
              onToggle={toggleRule}
              onEdit={onNavigateEdit}
              onDelete={deleteRule}
              onToggleExpand={toggleExpand}
              dragHandlers={{
                draggable: true,
                onDragStart: () => handleDragStart(idx),
                onDragOver: (e) => handleDragOver(e, idx),
                onDrop: () => handleDrop(idx),
                onDragEnd: handleDragEnd,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VIEW: Create / Edit Rule
// ============================================================

function CreateEditView({ mode, rule: initialRule, onSave, onCancel }) {
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [conditions, setConditions] = useState(initialRule?.conditions || []);
  const [actions, setActions] = useState(initialRule?.actions || []);
  const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
  const [stopOnMatch, setStopOnMatch] = useState(initialRule?.stopOnMatch ?? true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(mode === 'edit');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [suggestedDescription, setSuggestedDescription] = useState(null);
  const [descriptionSuggestionDismissed, setDescriptionSuggestionDismissed] = useState(false);
  const [aiUsed, setAiUsed] = useState(mode === 'edit');
  const [toast, setToast] = useState(null);

  const handleStartOver = useCallback(() => {
    setAiPrompt('');
    setName('');
    setDescription('');
    setConditions([]);
    setActions([]);
    setEnabled(true);
    setStopOnMatch(true);
    setAdvancedOpen(false);
    setCodeManuallyEdited(false);
    setSuggestedDescription(null);
    setDescriptionSuggestionDismissed(false);
    setAiUsed(false);
  }, []);

  const handleAISubmit = useCallback(() => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    // Simulate AI thinking time — varies 3–10s based on prompt complexity
    const wordCount = aiPrompt.trim().split(/\s+/).length;
    const baseDuration = 3000;
    const perWord = 350;
    const jitter = Math.random() * 800;
    const duration = Math.min(10000, Math.max(3000, baseDuration + wordCount * perWord + jitter));
    setTimeout(() => {
      if (!generated) {
        // Initial generation
        const result = simulateAIGeneration(aiPrompt);
        setConditions(result.conditions);
        setActions(result.actions);
        if (result.name) setName(result.name);
        if (result.description) setDescription(result.description);
        setCodeManuallyEdited(false);
        setSuggestedDescription(null);
        setDescriptionSuggestionDismissed(false);
        setAiUsed(true);
        setGenerated(true);
      } else {
        // Refinement
        const result = simulateAIRefine(aiPrompt, conditions, actions);
        setConditions(result.conditions);
        setActions(result.actions);
        if (result.name) setName(result.name);
        if (result.description) setDescription(result.description);
        setCodeManuallyEdited(false);
        setSuggestedDescription(null);
        setDescriptionSuggestionDismissed(false);
        setAiUsed(true);
        setToast("Rule updated based on your input.");
      }
      setAiPrompt('');
      setGenerating(false);
    }, duration);
  }, [aiPrompt, generated, conditions, actions]);

  const addCondition = useCallback(() => {
    const firstProp = ALL_PROPERTIES[0];
    setConditions(prev => [...prev, {
      id: makeId(),
      property: firstProp.key,
      operator: getOperatorsForType(firstProp.type)[0].value,
      value: firstProp.type === 'enum' ? firstProp.values[0] : '',
    }]);
  }, []);

  const updateCondition = useCallback((idx, updated) => {
    setConditions(prev => prev.map((c, i) => i === idx ? updated : c));
  }, []);

  const removeCondition = useCallback((idx) => {
    setConditions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addAction = useCallback(() => {
    const newAction = { id: makeId(), type: 'quarantine', config: {} };
    // Check delivery constraint
    if (isDeliveryAction(newAction.type)) {
      const existingDelivery = actions.find(a => isDeliveryAction(a.type));
      if (existingDelivery) {
        const def = getActionDef(existingDelivery.type);
        setActions(prev => prev.filter(a => a.id !== existingDelivery.id).concat(newAction));
        setToast(`Only one delivery action per rule — replaced ${def?.label} with Quarantine.`);
        return;
      }
    }
    setActions(prev => [...prev, newAction]);
  }, [actions]);

  const updateAction = useCallback((idx, updated) => {
    // Check delivery constraint when changing type
    if (isDeliveryAction(updated.type)) {
      const existingDelivery = actions.findIndex((a, i) => i !== idx && isDeliveryAction(a.type));
      if (existingDelivery >= 0) {
        const def = getActionDef(actions[existingDelivery].type);
        setActions(prev => prev.filter((_, i) => i !== existingDelivery).map((a, i) => i === idx || (i === idx - 1 && existingDelivery < idx) ? updated : a));
        setToast(`Only one delivery action per rule — replaced ${def?.label} with ${getActionDef(updated.type)?.label}.`);
        return;
      }
    }
    setActions(prev => prev.map((a, i) => i === idx ? updated : a));
  }, [actions]);

  const removeAction = useCallback((idx) => {
    setActions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSave = useCallback(() => {
    const saved = {
      id: initialRule?.id || makeId(),
      name: name || 'Untitled Rule',
      description,
      enabled,
      stopOnMatch,
      conditions,
      actions,
    };
    onSave(saved);
  }, [initialRule, name, description, enabled, stopOnMatch, conditions, actions, onSave]);

  // Update code text when conditions/actions change (unless user has manually edited the code)
  useEffect(() => {
    if (!codeManuallyEdited) {
      setCodeText(generateRuleCode(conditions, actions));
    }
  }, [conditions, actions, codeManuallyEdited]);

  const naturalLang = useMemo(() => generateNaturalLanguage(conditions, actions), [conditions, actions]);

  const showForm = generated || mode === 'edit';
  const hasRuleContent = conditions.length > 0 || actions.length > 0 || codeManuallyEdited;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">
          {mode === 'create' ? 'Add Action Rule' : 'Edit Action Rule'}
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20 space-y-6">

        {/* AI Prompt — persistent across both phases */}
        <section>
          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              showForm
                ? 'bg-slate-50 border border-slate-200 rounded-lg p-4'
                : 'bg-transparent border border-transparent rounded-lg pt-4 pb-0'
            }`}
          >
            {/* Big icon + heading — only initial state, collapses away */}
            <div
              className={`flex flex-col items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                !showForm && !generating
                  ? 'max-h-40 opacity-100 mb-5'
                  : 'max-h-0 opacity-0 mb-0'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Describe your rule in plain language</h2>
              <p className="text-sm text-slate-500 text-center">Tell us what you want to happen and we'll build the rule for you.</p>
            </div>

            {/* Compact "Building..." label — only visible during generation */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                generating ? 'max-h-8 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'
              }`}
            >
              <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse-soft" />
                <span className="animate-shimmer-text bg-gradient-to-r from-slate-800 via-blue-500 to-slate-800 bg-clip-text text-transparent bg-[length:200%_100%]">
                  Building your rule from your description…
                </span>
              </h3>
            </div>

            {/* Compact "Refine" label — only visible in resting form state */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                showForm && !generating ? 'max-h-8 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'
              }`}
            >
              <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                {hasRuleContent ? 'Refine your rule with AI' : 'Describe your rule in plain language'}
              </h3>
            </div>

            {/* The persistent textarea */}
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAISubmit();
                }
              }}
              placeholder={
                showForm
                  ? 'e.g., "and notify admins" or "change action to quarantine"'
                  : 'e.g., block all malicious emails from unknown senders and notify the admin team'
              }
              rows={showForm ? 2 : 3}
              readOnly={generating}
              className={`w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] no-scrollbar ${generating ? 'opacity-50' : ''}`}
              autoFocus
            />

            {/* Buttons row — below textarea in both states */}
            <div className="flex items-center justify-between mt-3">
              {showForm ? (
                <>
                  {aiUsed ? (
                    <button
                      onClick={handleStartOver}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Start over
                    </button>
                  ) : <span />}
                  <button
                    onClick={handleAISubmit}
                    disabled={generating || !aiPrompt.trim()}
                    className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {hasRuleContent ? 'Refine' : 'Generate'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setGenerated(true); setAdvancedOpen(true); }}
                    className={`text-sm font-medium text-slate-500 hover:text-slate-700 transition-opacity duration-500 ${generating ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    Skip and build manually
                  </button>
                  <button
                    onClick={handleAISubmit}
                    disabled={generating || !aiPrompt.trim()}
                    className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:cursor-not-allowed whitespace-nowrap disabled:opacity-100"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-pulse-soft' : ''}`} />
                    {generating ? 'Generating…' : 'Generate Rule'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Loading skeleton */}
        {generating && <section className="animate-fade-in"><SkeletonBlock /></section>}

        {/* Everything below only shows after generation (or in edit mode) */}
        {showForm && !generating && (
          <div className="space-y-6">
        {/* Section 1: Name & Description */}
        <section className="animate-stagger-in" style={{ animationDelay: '0ms' }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rule name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Quarantine Malicious Emails"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this rule is for — helps your team understand its purpose"
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />

              {/* AI Description Suggestion */}
              {(initialRule?.isLegacy || codeManuallyEdited) && !suggestedDescription && !descriptionSuggestionDismissed && (
                <button
                  onClick={() => setSuggestedDescription(generateDescriptionSuggestion(conditions, actions))}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors rounded-md px-2 py-1 -ml-2 animate-hint-in"
                >
                  <Sparkles className="w-3 h-3 animate-pulse-soft" />
                  {codeManuallyEdited ? 'Your code changed — update description with AI' : 'Suggest a better description with AI'}
                </button>
              )}

              {/* Ghost preview — shows the AI-suggested description with accept/dismiss */}
              {suggestedDescription && (
                <div className="mt-2 border border-blue-200 bg-blue-50/50 rounded-lg p-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3" />
                    AI suggestion
                  </div>
                  {description && (
                    <p className="text-xs text-slate-400 line-through mb-1.5 leading-relaxed">{description}</p>
                  )}
                  <p className="text-sm text-slate-800 leading-relaxed mb-3">{suggestedDescription}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setDescription(suggestedDescription); setSuggestedDescription(null); setDescriptionSuggestionDismissed(true); }}
                      className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => { setSuggestedDescription(null); setDescriptionSuggestionDismissed(true); }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Rule Summary */}
        <section className="animate-stagger-in" style={{ animationDelay: '60ms' }}>
          {naturalLang && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">Rule summary</label>
              <p className="text-sm text-slate-600 leading-relaxed">{naturalLang}</p>
            </div>
          )}
        </section>

        {/* Section 3: Settings */}
        <section className="animate-stagger-in" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stopOnMatch}
                  onChange={e => setStopOnMatch(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Stop evaluating other rules on match
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              Enable this action rule
              <Toggle checked={enabled} onChange={setEnabled} />
            </label>
          </div>
        </section>

        {/* Section 4: Expandable — Conditions, Actions & Rule Code */}
        <section className="border-t border-slate-200 pt-4 animate-stagger-in" style={{ animationDelay: '240ms' }}>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            View actions & rule code
          </button>

          <div className={`overflow-hidden transition-all duration-200 ease-out ${advancedOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-5">
              {/* Rule Code */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  Rule code
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                  <textarea
                    value={codeText}
                    onChange={e => { setCodeText(e.target.value); setCodeManuallyEdited(true); }}
                    className="w-full bg-transparent text-slate-700 font-mono text-xs leading-relaxed outline-none resize-none min-h-[100px]"
                    spellCheck={false}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Validate</button>
                  <a href="#" className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors">See Documentation</a>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Actions</h3>
                    <p className="text-[12px] text-slate-400">What happens when conditions are met</p>
                  </div>
                  <button onClick={addAction} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" /> Add action
                  </button>
                </div>
                <div className="space-y-1.5">
                  {actions.map((a, i) => (
                    <ActionCard
                      key={a.id}
                      action={a}
                      onChange={updated => updateAction(i, updated)}
                      onRemove={() => removeAction(i)}
                    />
                  ))}
                  {actions.length === 0 && (
                    <p className="text-xs text-slate-400 py-2">No actions configured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
          </div>
        )}
      </div>

      {/* Sticky Footer — only when form is showing */}
      {showForm && !generating && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end gap-2 mt-auto animate-stagger-in" style={{ animationDelay: '300ms' }}>
          <button onClick={onCancel} className="text-sm font-medium text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Rule
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// MAIN APP (view routing)
// ============================================================

function App() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editRuleId, setEditRuleId] = useState(null);
  const [rules, setRules] = useState(SEED_RULES);

  const navigateCreate = useCallback(() => {
    setView('create');
    setEditRuleId(null);
  }, []);

  const navigateEdit = useCallback((id) => {
    setEditRuleId(id);
    setView('edit');
  }, []);

  const navigateList = useCallback(() => {
    setView('list');
    setEditRuleId(null);
  }, []);

  const handleSave = useCallback((savedRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === savedRule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedRule;
        return next;
      }
      return [...prev, savedRule];
    });
    navigateList();
  }, [navigateList]);

  const editRule = editRuleId ? rules.find(r => r.id === editRuleId) : null;

  const panelOpen = view === 'create' || (view === 'edit' && editRule);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <RuleListView
          rules={rules}
          onNavigateCreate={navigateCreate}
          onNavigateEdit={navigateEdit}
          onUpdateRules={setRules}
        />
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
        style={{ opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none' }}
        onClick={navigateList}
      />

      {/* Slide-out Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: panelOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Close button */}
        <button
          onClick={navigateList}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'create' && (
          <CreateEditView
            mode="create"
            onSave={handleSave}
            onCancel={navigateList}
          />
        )}
        {view === 'edit' && editRule && (
          <CreateEditView
            key={editRule.id}
            mode="edit"
            rule={editRule}
            onSave={handleSave}
            onCancel={navigateList}
          />
        )}
      </div>
    </div>
  );
}

export default App;
