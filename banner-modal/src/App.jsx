import React, { useState, useEffect, Fragment } from 'react';
import { Info, Pencil, RotateCcw, X, Check, ChevronDown, ChevronLeft, ChevronRight, Mail, Smartphone, Monitor, GripHorizontal } from 'lucide-react';

// ============================================================
// UTILITIES & CONSTANTS
// ============================================================

const cn = (...classes) => classes.filter(Boolean).join(' ');

const THEMES = {
  gray:   { label: 'Gray',   swatch: 'bg-zinc-400',  bg: 'bg-zinc-50 dark:bg-zinc-900/40',  border: 'border-zinc-200 dark:border-zinc-700',   icon: 'bg-zinc-700 dark:bg-zinc-500' },
  red:    { label: 'Red',    swatch: 'bg-red-500',   bg: 'bg-red-50 dark:bg-red-950/30',    border: 'border-red-200 dark:border-red-900/50',  icon: 'bg-red-600' },
  yellow: { label: 'Yellow', swatch: 'bg-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30',border: 'border-amber-200 dark:border-amber-900/50', icon: 'bg-amber-500' },
};

const DEFAULTS = {
  title: 'Security Risk',
  body: 'This message contains malicious attachments. Opening these files could harm your device.',
  footer: 'protection by VIPRE Integrated Email Security',
};

const initialConfig = {
  name: '',
  theme: 'gray',
  titleMode: 'default',
  customTitle: '',
  bodyMode: 'default',
  customBody: '',
  footerMode: 'default',
  customFooter: '',
};

// ============================================================
// SHARED SUB-COMPONENTS
// ============================================================

function BannerPreview({ config }) {
  const theme = THEMES[config.theme];
  const title = config.titleMode === 'custom' && config.customTitle ? config.customTitle : DEFAULTS.title;
  const body = config.bodyMode === 'custom' && config.customBody ? config.customBody : DEFAULTS.body;
  const footer = config.footerMode === 'custom' && config.customFooter ? config.customFooter : DEFAULTS.footer;

  return (
    <div>
      <div className={cn('rounded-md border p-4', theme.bg, theme.border)}>
        <div className="flex gap-3">
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', theme.icon)}>
            <Info size={12} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{title}</div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug mb-3">
              {body} <span className="underline font-medium cursor-pointer">View Details</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">Agree</button>
              <button className="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">Report as Safe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs italic text-zinc-500 dark:text-zinc-400 text-center mt-3">{footer}</div>
    </div>
  );
}

function ThemeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const theme = THEMES[value];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex items-center gap-2">
          <span className={cn('w-3 h-3 rounded-full', theme.swatch)} />
          {theme.label}
        </span>
        <ChevronDown size={16} className="text-zinc-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <span className={cn('w-3 h-3 rounded-full', t.swatch)} />
                {t.label}
                {value === key && <Check size={14} className="ml-auto text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-1.5">{children}</label>;
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        props.className
      )}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
        props.className
      )}
    />
  );
}

function DefaultFooter() {
  return (
    <div className="flex justify-end gap-2 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <button className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">Cancel</button>
      <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5">
        <Check size={14} /> Save
      </button>
    </div>
  );
}

function ModalFrame({ title, subtitle, children, onClose, footer }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
      <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" onClick={onClose}><X size={20} /></button>
      </div>
      {children}
      {footer !== undefined ? footer : <DefaultFooter />}
    </div>
  );
}

// ============================================================
// OPTION A — SEGMENTED TOGGLE + PROGRESSIVE REVEAL
// ============================================================

function SegmentedToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
      {[['default', 'Default'], ['custom', 'Custom']].map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded transition-all',
            value === v
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OptionAField({ label, mode, customValue, defaultHint, onModeChange, onCustomChange, multiline, placeholder }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>{label}</FieldLabel>
        <SegmentedToggle value={mode} onChange={onModeChange} />
      </div>
      {mode === 'default' ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 italic px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
          {defaultHint}
        </div>
      ) : multiline ? (
        <TextArea rows={3} value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
      ) : (
        <TextInput value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
      )}
    </div>
  );
}

function OptionA() {
  const [c, setC] = useState(initialConfig);
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  return (
    <ModalFrame title="Add Banner" subtitle="Banners inject a visual warning into incoming emails flagged by policy rules.">
      <div className="grid grid-cols-5 gap-6 p-6">
        <div className="col-span-3 space-y-5">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" />
          </div>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
          </div>
          <OptionAField
            label="Title"
            mode={c.titleMode}
            customValue={c.customTitle}
            defaultHint="Generated from message content. Example shown in preview."
            onModeChange={v => update({ titleMode: v })}
            onCustomChange={v => update({ customTitle: v })}
            placeholder="Enter a custom title"
          />
          <OptionAField
            label="Body"
            mode={c.bodyMode}
            customValue={c.customBody}
            defaultHint="Generated from message content. Describes the specific threat detected."
            onModeChange={v => update({ bodyMode: v })}
            onCustomChange={v => update({ customBody: v })}
            multiline
            placeholder="Enter a custom body"
          />
          <OptionAField
            label="Footer"
            mode={c.footerMode}
            customValue={c.customFooter}
            defaultHint={`"${DEFAULTS.footer}"`}
            onModeChange={v => update({ footerMode: v })}
            onCustomChange={v => update({ customFooter: v })}
            placeholder="Enter a custom footer"
          />
        </div>
        <div className="col-span-2">
          <div className="sticky top-4">
            <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-3">Live preview</div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <BannerPreview config={c} />
            </div>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

// ============================================================
// OPTION B — SMART FIELD WITH IN-PLACE EDIT
// ============================================================

function SmartField({ label, mode, customValue, defaultPreview, onModeChange, onCustomChange, multiline, placeholder }) {
  const isDefault = mode === 'default';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <FieldLabel>{label}</FieldLabel>
        {isDefault ? (
          <button
            type="button"
            onClick={() => onModeChange('custom')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <Pencil size={11} /> Override
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onModeChange('default')}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
          >
            <RotateCcw size={11} /> Reset to default
          </button>
        )}
      </div>
      {isDefault ? (
        <div className="px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
          <span className="mt-0.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex-shrink-0">Auto</span>
          <span className="italic">{defaultPreview}</span>
        </div>
      ) : multiline ? (
        <TextArea rows={3} value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
      ) : (
        <TextInput value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
      )}
    </div>
  );
}

function OptionB() {
  const [c, setC] = useState(initialConfig);
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  return (
    <ModalFrame title="Add Banner" subtitle="Banners inject a visual warning into incoming emails flagged by policy rules.">
      <div className="grid grid-cols-5 gap-6 p-6">
        <div className="col-span-3 space-y-5">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" />
          </div>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
          </div>
          <SmartField
            label="Title"
            mode={c.titleMode}
            customValue={c.customTitle}
            defaultPreview="System-generated title based on the threat detected"
            onModeChange={v => update({ titleMode: v })}
            onCustomChange={v => update({ customTitle: v })}
            placeholder="Enter a custom title"
          />
          <SmartField
            label="Body"
            mode={c.bodyMode}
            customValue={c.customBody}
            defaultPreview="System-generated description of the specific threat detected in the message"
            onModeChange={v => update({ bodyMode: v })}
            onCustomChange={v => update({ customBody: v })}
            multiline
            placeholder="Enter a custom body"
          />
          <SmartField
            label="Footer"
            mode={c.footerMode}
            customValue={c.customFooter}
            defaultPreview={DEFAULTS.footer}
            onModeChange={v => update({ footerMode: v })}
            onCustomChange={v => update({ customFooter: v })}
            placeholder="Enter a custom footer"
          />
        </div>
        <div className="col-span-2">
          <div className="sticky top-4">
            <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-3">Live preview</div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <BannerPreview config={c} />
            </div>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

// ============================================================
// OPTION C — EMAIL-CONTEXT PREVIEW + COMPACT FORM
// ============================================================

function CompactSmartField({ label, mode, customValue, defaultPreview, onModeChange, onCustomChange, multiline, placeholder }) {
  const isDefault = mode === 'default';
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 flex-shrink-0 w-14">{label}</span>
          {isDefault ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400 italic truncate">{defaultPreview}</span>
          ) : (
            <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{customValue || <span className="text-zinc-400 italic">Empty</span>}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onModeChange(isDefault ? 'custom' : 'default')}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 flex-shrink-0"
        >
          {isDefault ? <><Pencil size={11} /> Override</> : <><RotateCcw size={11} /> Reset</>}
        </button>
      </div>
      {!isDefault && (
        <div className="mt-2">
          {multiline ? (
            <TextArea rows={2} value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
          ) : (
            <TextInput value={customValue} onChange={e => onCustomChange(e.target.value)} placeholder={placeholder} autoFocus />
          )}
        </div>
      )}
    </div>
  );
}

function EmailPreview({ config }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2">
        <Mail size={14} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Inbox preview</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">AB</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Accounting &lt;billing@ex-ternal.com&gt;</div>
              <div className="text-xs text-zinc-400">10:42 AM</div>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">to me</div>
          </div>
        </div>
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Invoice overdue — action required</div>
        <BannerPreview config={config} />
        <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pt-2">
          <p>Dear Customer,</p>
          <p className="mt-2 opacity-60">Your invoice #4471 is 14 days overdue. Please review the attached statement and remit payment...</p>
        </div>
      </div>
    </div>
  );
}

function OptionC() {
  const [c, setC] = useState(initialConfig);
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  return (
    <ModalFrame title="Add Banner" subtitle="Banners inject a visual warning into incoming emails flagged by policy rules.">
      <div className="grid grid-cols-5 gap-6 p-6">
        <div className="col-span-2 space-y-5">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" />
          </div>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
          </div>
          <div>
            <FieldLabel>Content</FieldLabel>
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-3">
              <CompactSmartField
                label="Title"
                mode={c.titleMode}
                customValue={c.customTitle}
                defaultPreview="System-generated"
                onModeChange={v => update({ titleMode: v })}
                onCustomChange={v => update({ customTitle: v })}
                placeholder="Custom title"
              />
              <CompactSmartField
                label="Body"
                mode={c.bodyMode}
                customValue={c.customBody}
                defaultPreview="System-generated"
                onModeChange={v => update({ bodyMode: v })}
                onCustomChange={v => update({ customBody: v })}
                multiline
                placeholder="Custom body"
              />
              <CompactSmartField
                label="Footer"
                mode={c.footerMode}
                customValue={c.customFooter}
                defaultPreview={DEFAULTS.footer}
                onModeChange={v => update({ footerMode: v })}
                onCustomChange={v => update({ customFooter: v })}
                placeholder="Custom footer"
              />
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="sticky top-4">
            <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-3">How recipients will see it</div>
            <EmailPreview config={c} />
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

// ============================================================
// OPTION D — STEPPED WIZARD (MOBILE-FIRST)
// ============================================================

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <Fragment key={i}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors',
              i < current ? 'bg-blue-600 text-white' : i === current ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
            )}>
              {i < current ? <Check size={12} strokeWidth={3} /> : i + 1}
            </div>
            <span className={cn('text-xs font-medium', i === current ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500')}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 min-w-4', i < current ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800')} />}
        </Fragment>
      ))}
    </div>
  );
}

function OptionD({ isMobile }) {
  const [c, setC] = useState(initialConfig);
  const [step, setStep] = useState(0);
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  const steps = ['Basics', 'Content', 'Review'];
  const last = step === steps.length - 1;

  const footer = (
    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <button
        onClick={() => step > 0 && setStep(s => s - 1)}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5',
          step === 0 ? 'text-zinc-400 dark:text-zinc-600 cursor-default' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        )}
      >
        <ChevronLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
      </button>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">{step + 1} / {steps.length}</div>
      <button
        onClick={() => !last && setStep(s => s + 1)}
        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5"
      >
        {last ? <><Check size={14} /> Save</> : <>Next <ChevronRight size={14} /></>}
      </button>
    </div>
  );

  return (
    <ModalFrame title="Add Banner" subtitle="Step through each section. Your work is saved as you go." footer={footer}>
      <div className="px-6 pt-4">
        <StepIndicator steps={steps} current={step} />
      </div>
      <div className={cn('p-6 space-y-5', !isMobile && 'min-h-[420px]')}>
        {step === 0 && (
          <>
            <div>
              <FieldLabel>Name</FieldLabel>
              <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" autoFocus />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Internal label — policy rules reference banners by name.</p>
            </div>
            <div>
              <FieldLabel>Theme</FieldLabel>
              <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Match the color to the severity of the threat.</p>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <SmartField
              label="Title"
              mode={c.titleMode}
              customValue={c.customTitle}
              defaultPreview="System-generated title based on the threat detected"
              onModeChange={v => update({ titleMode: v })}
              onCustomChange={v => update({ customTitle: v })}
              placeholder="Enter a custom title"
            />
            <SmartField
              label="Body"
              mode={c.bodyMode}
              customValue={c.customBody}
              defaultPreview="System-generated description of the specific threat detected in the message"
              onModeChange={v => update({ bodyMode: v })}
              onCustomChange={v => update({ customBody: v })}
              multiline
              placeholder="Enter a custom body"
            />
            <SmartField
              label="Footer"
              mode={c.footerMode}
              customValue={c.customFooter}
              defaultPreview={DEFAULTS.footer}
              onModeChange={v => update({ footerMode: v })}
              onCustomChange={v => update({ customFooter: v })}
              placeholder="Enter a custom footer"
            />
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-2">Summary</div>
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.name || <span className="italic text-zinc-400">Untitled</span>}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Theme</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className={cn('w-2.5 h-2.5 rounded-full', THEMES[c.theme].swatch)} />
                    {THEMES[c.theme].label}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Title</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.titleMode === 'custom' && c.customTitle ? 'Custom' : 'Auto'}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Body</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.bodyMode === 'custom' && c.customBody ? 'Custom' : 'Auto'}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Footer</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.footerMode === 'custom' && c.customFooter ? 'Custom' : 'Auto'}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-2">Preview</div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <BannerPreview config={c} />
              </div>
            </div>
          </>
        )}
      </div>
    </ModalFrame>
  );
}

// ============================================================
// OPTION E — EDIT / PREVIEW TABS (RESPONSIVE)
// ============================================================

function OptionE({ isMobile }) {
  const [c, setC] = useState(initialConfig);
  const [tab, setTab] = useState('edit');
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  const form = (
    <div className="space-y-5">
      <div>
        <FieldLabel>Name</FieldLabel>
        <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" />
      </div>
      <div>
        <FieldLabel>Theme</FieldLabel>
        <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
      </div>
      <SmartField
        label="Title"
        mode={c.titleMode}
        customValue={c.customTitle}
        defaultPreview="System-generated title based on the threat detected"
        onModeChange={v => update({ titleMode: v })}
        onCustomChange={v => update({ customTitle: v })}
        placeholder="Enter a custom title"
      />
      <SmartField
        label="Body"
        mode={c.bodyMode}
        customValue={c.customBody}
        defaultPreview="System-generated description of the specific threat detected in the message"
        onModeChange={v => update({ bodyMode: v })}
        onCustomChange={v => update({ customBody: v })}
        multiline
        placeholder="Enter a custom body"
      />
      <SmartField
        label="Footer"
        mode={c.footerMode}
        customValue={c.customFooter}
        defaultPreview={DEFAULTS.footer}
        onModeChange={v => update({ footerMode: v })}
        onCustomChange={v => update({ customFooter: v })}
        placeholder="Enter a custom footer"
      />
    </div>
  );

  const preview = (
    <div>
      <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-3">Live preview</div>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <BannerPreview config={c} />
      </div>
    </div>
  );

  return (
    <ModalFrame title="Add Banner" subtitle="Banners inject a visual warning into incoming emails flagged by policy rules.">
      {isMobile && (
        <div className="px-4 pt-2 border-b border-zinc-200 dark:border-zinc-800 flex gap-1">
          {[['edit', 'Edit'], ['preview', 'Preview']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === v ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {isMobile ? (
        <div className="p-6">
          {tab === 'edit' ? form : preview}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6 p-6">
          <div className="col-span-3">{form}</div>
          <div className="col-span-2">
            <div className="sticky top-4">{preview}</div>
          </div>
        </div>
      )}
    </ModalFrame>
  );
}

// ============================================================
// OPTION F — BOTTOM SHEET PREVIEW (MOBILE) / SIDE RAIL (DESKTOP)
// ============================================================

function OptionF({ isMobile }) {
  const [c, setC] = useState(initialConfig);
  const [sheet, setSheet] = useState('peek');
  const update = patch => setC(prev => ({ ...prev, ...patch }));

  const formFields = (
    <>
      <div>
        <FieldLabel>Name</FieldLabel>
        <TextInput value={c.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Phishing Alert" />
      </div>
      <div>
        <FieldLabel>Theme</FieldLabel>
        <ThemeSelect value={c.theme} onChange={v => update({ theme: v })} />
      </div>
      <SmartField
        label="Title"
        mode={c.titleMode}
        customValue={c.customTitle}
        defaultPreview="System-generated title based on the threat detected"
        onModeChange={v => update({ titleMode: v })}
        onCustomChange={v => update({ customTitle: v })}
        placeholder="Enter a custom title"
      />
      <SmartField
        label="Body"
        mode={c.bodyMode}
        customValue={c.customBody}
        defaultPreview="System-generated description of the specific threat detected in the message"
        onModeChange={v => update({ bodyMode: v })}
        onCustomChange={v => update({ customBody: v })}
        multiline
        placeholder="Enter a custom body"
      />
      <SmartField
        label="Footer"
        mode={c.footerMode}
        customValue={c.customFooter}
        defaultPreview={DEFAULTS.footer}
        onModeChange={v => update({ footerMode: v })}
        onCustomChange={v => update({ customFooter: v })}
        placeholder="Enter a custom footer"
      />
    </>
  );

  if (!isMobile) {
    return (
      <ModalFrame title="Add Banner" subtitle="Preview docks to the right on desktop, collapses to a bottom sheet on mobile.">
        <div className="grid grid-cols-5 gap-6 p-6">
          <div className="col-span-3 space-y-5">{formFields}</div>
          <div className="col-span-2">
            <div className="sticky top-4">
              <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-3">Live preview</div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <BannerPreview config={c} />
              </div>
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  const sheetHeights = {
    peek: 'h-[56px]',
    half: 'h-[280px]',
    full: 'h-[480px]',
  };
  const cycle = () => setSheet(s => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));
  const expanded = sheet !== 'peek';

  return (
    <ModalFrame title="Add Banner" subtitle="Tap the sheet to peek, expand, or close the preview.">
      <div className="relative" style={{ minHeight: 520 }}>
        <div className="p-6 space-y-5 pb-20">{formFields}</div>

        <div className={cn(
          'absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.15)] transition-[height] duration-300 overflow-hidden',
          sheetHeights[sheet]
        )}>
          <button
            onClick={cycle}
            className="w-full py-2.5 flex flex-col items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <GripHorizontal size={18} className="text-zinc-300 dark:text-zinc-600 -mb-0.5" />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Preview
              {!expanded && <span className="text-zinc-400 dark:text-zinc-500 normal-case font-normal tracking-normal">· tap to expand</span>}
            </div>
          </button>
          {expanded && (
            <div className="px-5 pb-5 overflow-auto" style={{ height: 'calc(100% - 52px)' }}>
              <BannerPreview config={c} />
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

const OPTIONS = [
  {
    id: 'A',
    title: 'Segmented Toggle',
    tagline: 'Conservative refactor — fixes the broken interaction, keeps the mental model.',
    grade: 74,
    pros: [
      'Lowest implementation risk — same information architecture as current design',
      'Segmented control is a clearer binary than paired radios',
      'Default hints make the auto-generated text discoverable'
    ],
    cons: [
      'Still a two-step interaction (toggle, then type) for every customization',
      'Isolated banner preview leaves the right half of the modal underused',
      'Draft custom text must be preserved across toggles — extra state work'
    ],
    best: 'When stakeholder appetite for change is low and you need to ship this sprint.'
  },
  {
    id: 'B',
    title: 'Smart Field',
    tagline: 'One action per field. State is always visible. Override and reset are symmetric.',
    grade: 87,
    pros: [
      'Collapses toggle + input into a single affordance — half the interaction cost',
      'Default state shows what will be sent — no hidden behavior',
      'The "Auto" chip is a durable pattern — scales to other generated fields later'
    ],
    cons: [
      'Pattern is less familiar than radios, needs brief usability validation',
      'Preview pane is still a standalone banner, not email context',
      'Override/Reset buttons are small affordances — need adequate hit target'
    ],
    best: 'The recommended direction. Strong balance of clarity, speed, and familiarity.'
  },
  {
    id: 'C',
    title: 'Email-Context Preview',
    tagline: 'Banner shown inside a mocked inbox. Form compressed. Preview leads.',
    grade: 82,
    pros: [
      'Preview is unambiguous — admins see exactly what the recipient sees',
      'Compact inline form eliminates the whitespace problem entirely',
      'Closes the gap for new admins who have not seen a banner in context before'
    ],
    cons: [
      'Mocked email must be maintained and may drift from real clients (Outlook, Gmail)',
      'Compact field rows sacrifice some editing comfort for long body text',
      'Highest implementation effort — email preview is non-trivial to maintain'
    ],
    best: 'When the buyer or admin audience is new to the product and context matters.'
  },
  {
    id: 'D',
    title: 'Stepped Wizard',
    tagline: 'Three focused steps — Basics, Content, Review. One decision per screen.',
    grade: 76,
    mobile: true,
    pros: [
      'Every step is full-width with tall tap targets — thumb-friendly on mobile by default',
      'Linear flow means admins cannot miss the Default/Custom decision for any field',
      'Progress indicator gives a clear sense of remaining work — reduces abandonment'
    ],
    cons: [
      'Slower for desktop power users who want to see everything at once',
      'Live preview is deferred to the final step — weakens the edit feedback loop',
      'Feels heavy for returning admins making a small edit vs. a brand-new setup'
    ],
    best: 'When the admin audience skews new/infrequent and setup errors are expensive.'
  },
  {
    id: 'E',
    title: 'Edit / Preview Tabs',
    tagline: 'Tabs on mobile, split view on desktop. One component, two viewports.',
    grade: 79,
    mobile: true,
    pros: [
      'Responsive by pure layout — same component gracefully handles every viewport',
      'Familiar mobile pattern (iOS/Android settings, Stripe) — zero learning curve',
      'Lowest implementation cost of the three mobile options — reuses existing form'
    ],
    cons: [
      'Loses the live-preview feedback loop on mobile — admins must tap to verify',
      'Tab state is ambiguous after save/cancel — which tab were you on?',
      'Feels slightly primitive on large desktops where split view is clearly better'
    ],
    best: 'When you need a fast responsive pass and can accept the mobile feedback-loop tradeoff.'
  },
  {
    id: 'F',
    title: 'Bottom Sheet Preview',
    tagline: 'Form fills the screen. Preview is a pull-up sheet that peeks, expands, collapses.',
    grade: 84,
    mobile: true,
    pros: [
      'Preview is always reachable on mobile without dominating the screen',
      'Single component transforms into the desktop side rail — one mental model across devices',
      'Feels modern and native — matches patterns from Apple Maps, Spotify, Google Maps'
    ],
    cons: [
      'Sheet discoverability hinges on a good peek affordance — easy to get wrong',
      'Drag/swipe gestures do not have clean desktop equivalents — need fallbacks',
      'Highest implementation complexity — snap points, focus management, scroll-locking'
    ],
    best: 'When mobile usage is a first-class concern and you have appetite for a polished pattern.'
  }
];

export default function BannerModalOptions() {
  const [activeId, setActiveId] = useState('B');
  const [viewport, setViewport] = useState('desktop');
  const active = OPTIONS.find(o => o.id === activeId);
  const isMobile = viewport === 'mobile';

  useEffect(() => {
    setViewport(active.mobile ? 'mobile' : 'desktop');
  }, [activeId]);

  const gradeColor = (g) => {
    if (g >= 85) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900';
    if (g >= 75) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900';
    return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6 lg:p-10" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Banner — Design Options</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Six interaction patterns for the Default / Custom behavior — three desktop-focused, three mobile-first. Graded on a composite of interaction logic, hierarchy, error resilience, accessibility, and visual polish.</p>
        </div>

        {/* Option selector tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveId(opt.id)}
              className={cn(
                'text-left rounded-lg border p-4 transition-all relative',
                activeId === opt.id
                  ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-zinc-900 ring-2 ring-blue-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
              )}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Option {opt.id}</span>
                    {opt.mobile && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900">
                        <Smartphone size={9} /> Mobile-first
                      </span>
                    )}
                  </div>
                  <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{opt.title}</div>
                </div>
                <div className={cn('px-2.5 py-1 rounded-md border text-sm font-bold tabular-nums flex-shrink-0', gradeColor(opt.grade))}>
                  {opt.grade}
                </div>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{opt.tagline}</div>
            </button>
          ))}
        </div>

        {/* Viewport toggle */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Viewport</span>
          <div className="inline-flex items-center p-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
            {[['desktop', 'Desktop', Monitor], ['mobile', 'Mobile', Smartphone]].map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all',
                  viewport === v
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          {isMobile && !active.mobile && (
            <span className="text-xs text-amber-700 dark:text-amber-400">Option {active.id} is not mobile-optimized — switch to D, E, or F to see a mobile-first pattern.</span>
          )}
          {!isMobile && active.mobile && (
            <span className="text-xs text-violet-700 dark:text-violet-400">Option {active.id}'s distinct behavior lives on mobile — desktop collapses to a familiar split view. Toggle to Mobile to see it.</span>
          )}
        </div>

        {/* Active option display */}
        <div className="mb-6">
          {isMobile ? (
            <div className="mx-auto w-fit rounded-[2.25rem] border-[10px] border-zinc-900 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-800 shadow-2xl p-1">
              <div className="w-[384px] rounded-[1.5rem] overflow-hidden bg-white dark:bg-zinc-950">
                {activeId === 'A' && <OptionA isMobile />}
                {activeId === 'B' && <OptionB isMobile />}
                {activeId === 'C' && <OptionC isMobile />}
                {activeId === 'D' && <OptionD isMobile />}
                {activeId === 'E' && <OptionE isMobile />}
                {activeId === 'F' && <OptionF isMobile />}
              </div>
            </div>
          ) : (
            <>
              {activeId === 'A' && <OptionA isMobile={false} />}
              {activeId === 'B' && <OptionB isMobile={false} />}
              {activeId === 'C' && <OptionC isMobile={false} />}
              {activeId === 'D' && <OptionD isMobile={false} />}
              {activeId === 'E' && <OptionE isMobile={false} />}
              {activeId === 'F' && <OptionF isMobile={false} />}
            </>
          )}
        </div>

        {/* Rationale */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('px-3 py-1.5 rounded-md border text-base font-bold tabular-nums', gradeColor(active.grade))}>
              {active.grade} / 100
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Option {active.id} — {active.title}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">Strengths</div>
              <ul className="space-y-1.5">
                {active.pros.map((p, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                    <span className="text-emerald-600 dark:text-emerald-500 flex-shrink-0">+</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">Trade-offs</div>
              <ul className="space-y-1.5">
                {active.cons.map((p, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                    <span className="text-amber-600 dark:text-amber-500 flex-shrink-0">−</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Best when</div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">{active.best}</div>
          </div>
        </div>

        {/* Grading rubric */}
        <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-semibold">Rubric:</span> Interaction logic (30) · Information hierarchy (20) · Error resilience (15) · Accessibility (15) · Visual polish (20)
        </div>
      </div>
    </div>
  );
}
