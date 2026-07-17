import { useState, useEffect } from 'react';
import {
  X, CheckCircle, ChevronRight, Check, Shield, ShieldCheck, Mail,
  Send, ArrowLeft, Cloud, Globe, Lock, Users, Bug
} from '@icons';
import {
  Button, Checkbox, Field, Heading, Input, Modal, Select, Text,
} from './vds/components/index.js';
import { typeConfig } from './config';
import './provisioning.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'Japan', 'France', 'India', 'Brazil', 'Netherlands',
  'Singapore', 'Sweden', 'South Korea', 'Italy', 'Spain', 'Mexico',
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Madrid', 'Asia/Tokyo', 'Asia/Singapore',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Portuguese'];

// Product accents are a light/dark token PAIR, handed to .prov-product as inline custom
// properties; provisioning.css picks the right one per mode and derives the icon, the
// selected border, the ring and the fill from that single value.
//
// KNOWN GAP — the catalog wants 9 hues (indigo/violet/cyan/teal/sky/blue/amber/emerald/
// rose); the DS ships 7 chromatic families + midnight. Mapping by nearest hue
// (indigo→midnight, violet→orchid, cyan+teal→harbor, sky+blue→azure) therefore COLLIDES
// on 5 pairs, which now share an accent: edge/epmail, edge-nordics/epmail360,
// essentials/emailcloud, complete/exchangesmart, complete-nordics/exchangesmart-suite.
// Fixing it needs new DS families — a Vipre-team call, not a per-consumer hack. (The MSP
// v2 shell sidesteps this entirely: it identifies products by glyph artwork, no colour.)
const A = (family, light, dark) => ({
  accentLight: `var(--vds-${family}-${light})`,
  accentDark: `var(--vds-${family}-${dark})`,
});

const PRODUCTS = [
  // IES
  { key: 'ies',                 category: 'IES',      Icon: Mail,        ...A('midnight', 500, 300), name: 'VIPRE IES',                     description: 'Advanced cloud-native email security technology that integrates seamlessly via API.' },
  { key: 'ies-beta',            category: 'IES',      Icon: Mail,        ...A('midnight', 400, 200), name: 'VIPRE IES BETA',                description: 'Beta release of VIPRE Integrated Email Security with the latest threat protection updates.' },
  // SafeSend
  { key: 'safesend',            category: 'SafeSend', Icon: Send,        ...A('emerald', 500, 300),  name: 'VIPRE SafeSend',                description: 'Outbound email safety prompts to prevent misdirected emails and accidental data leaks.' },
  { key: 'safesend-ai',         category: 'SafeSend', Icon: Send,        ...A('emerald', 600, 400),  name: 'VIPRE SafeSend + AI addon',     description: 'SafeSend with AI-powered content analysis for smarter outbound email safety checks.' },
  { key: 'safesend-beta',       category: 'SafeSend', Icon: Send,        ...A('emerald', 400, 200),  name: 'VIPRE SafeSend Beta',           description: 'Beta release of VIPRE SafeSend with the latest outbound email safety features.' },
  // Security / Email SEG
  { key: 'tep',                 category: 'Security', Icon: ShieldCheck, ...A('orchid', 500, 300),   name: 'VIPRE Total Email Protection',  description: 'Comprehensive multi-tier protection combining SEG and IES — the only package with both.' },
  { key: 'atp',                 category: 'Security', Icon: Bug,         ...A('rose', 500, 300),     name: 'Advanced Threat Protection',    description: 'Core VIPRE Email Security Cloud with EDR and attachment sandboxing.' },
  { key: 'edge',                category: 'Security', Icon: Globe,       ...A('harbor', 500, 300),   name: 'Edge Defense',                  description: 'Comprehensive email protection bundle including Email IES and DNS navigation.' },
  { key: 'complete',            category: 'Security', Icon: Shield,      ...A('azure', 600, 400),    name: 'Complete Defense',              description: 'Comprehensive email protection bundle including Email IES and DNS navigation.' },
  { key: 'edge-nordics',        category: 'Security', Icon: Globe,       ...A('harbor', 600, 400),   name: 'Edge Defense Nordics',          description: 'Edge Defense bundle with Email IES and SafeSend, tailored for Nordic markets.' },
  { key: 'complete-nordics',    category: 'Security', Icon: Shield,      ...A('azure', 700, 500),    name: 'Complete Defense Nordics',      description: 'Complete Defense bundle with Email IES and SafeSend, tailored for Nordic markets.' },
  { key: 'email360',            category: 'Security', Icon: Mail,        ...A('orchid', 600, 400),   name: 'VIPRE Email 360',               description: 'Full solution combining VIPRE System EndPoint Enhanced Threat Protection with Security Awareness Training.' },
  { key: 'epmail',              category: 'Security', Icon: Users,       ...A('harbor', 500, 300),   name: 'VIPRE Endpoint+Email',          description: 'Combination of VIPRE Endpoint Cloud and Email Cloud for essential protection.' },
  { key: 'epmail360',           category: 'Security', Icon: Users,       ...A('harbor', 600, 400),   name: 'VIPRE Endpoint+Email 360',      description: 'Next-gen email and endpoint threat protection with Security Awareness Training.' },
  { key: 'essentials',          category: 'Security', Icon: Shield,      ...A('azure', 500, 300),    name: 'Essentials',                    description: 'Protect your organisation from spam and viruses with 30-day email replay and 7-day email assist.' },
  { key: 'emailcloud',          category: 'Security', Icon: Cloud,       ...A('azure', 500, 300),    name: 'Email Cloud',                   description: 'Get additional security with Email Cloud and protect yourself from unplanned email outages. Includes 90 days of continuity.' },
  { key: 'exchangesmart',       category: 'Security', Icon: Mail,        ...A('azure', 600, 400),    name: 'ExchangeSMART',                 description: 'All the enhanced collaboration features of Microsoft Exchange with email filtering, PrivacySMART, and 14-day email replay.' },
  { key: 'exchangesmart-suite', category: 'Security', Icon: Mail,        ...A('azure', 700, 500),    name: 'ExchangeSMART Suite',           description: 'The complete Microsoft Exchange bundle including unlimited archiving, compliance scanning, and extended search.' },
  { key: 'essentials-inbound',  category: 'Security', Icon: Shield,      ...A('azure', 400, 200),    name: 'Essentials Inbound Only',       description: 'Get unlimited security with SecureSmart and protect yourself from unplanned email outages. Includes 90 days of Email Continuity.' },
  { key: 'vaultcritical',       category: 'Security', Icon: Lock,        ...A('amber', 500, 300),    name: 'VaultCritical Suite',           description: 'Seamlessly pairs cloud email archiving with "Email Cloud" giving world-class archiving and email continuity.' },
];

const SEG_ADD_ONS = ['Legacy Archiving, 3 years', 'Legacy Archiving, unlimited', 'Image Analyzer', 'DNS Service', 'Extended Message Logs - 1 year', 'Extended Message Logs - 5 years', 'Extended Message Logs - 10 years'];

// Which products a partner can be granted, and their SEG add-ons. Accents reuse the
// PRODUCTS table so the two views can't drift apart.
const PRODUCT_PERMISSIONS_DEF = Object.fromEntries(
  PRODUCTS.map(p => [
    p.key,
    {
      name: p.name,
      Icon: p.Icon,
      accentLight: p.accentLight,
      accentDark: p.accentDark,
      addOns: p.category === 'Security' ? SEG_ADD_ONS : [],
    },
  ]),
);

function defaultPermissions() {
  const perms = {};
  for (const [key, def] of Object.entries(PRODUCT_PERMISSIONS_DEF)) {
    perms[key] = {
      enabled: true,
      addOns: Object.fromEntries(def.addOns.map(a => [a, true])),
    };
  }
  return perms;
}

// ── Local composites ───────────────────────────────────────────────────────────
//
// Everything else composes DS components directly. These two are DS GAPS — hand-built,
// but bound to DS tokens (see provisioning.css) so they can't drift on colour:
//
//   OptionalLabel — DS Field has no optional/required marker, so the "(Optional)"
//                   affix is composed into the label node.
//   ActionRow     — the tall arrow-row used by the confirmation screens and the type
//                   picker. No DS twin (it isn't a Button, Menu, or Card). Worth a real
//                   DS component if the pattern recurs.

function OptionalLabel({ children }) {
  return (
    <>
      {children}
      {/* The offset sits on a plain wrapper, never on Text's own className:
          `.vds-text { margin: 0 }` would win. */}
      <span className="prov-optional">
        <Text as="span" variant="caption" tone="subtle">(Optional)</Text>
      </span>
    </>
  );
}

function ActionRow({ onClick, icon, title, description, height }) {
  return (
    <button type="button" onClick={onClick} className="prov-actionrow" style={{ height }}>
      {icon}
      <span className="prov-actionrow__body">
        <Heading level="subheading" as="span" style={{ display: 'block' }}>{title}</Heading>
        {description && <Text as="span" variant="detail" tone="muted" style={{ display: 'block' }}>{description}</Text>}
      </span>
      <ChevronRight className="prov-actionrow__chev" />
    </button>
  );
}

// ── Confirmation hub ───────────────────────────────────────────────────────────

function ConfirmationHub({ title, subtitle, actions, onClose }) {
  return (
    <Modal open onClose={onClose} size="sm" aria-label={title}>
      <div className="prov-center" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <CheckCircle style={{ width: 48, height: 48, color: 'var(--vds-success)', flexShrink: 0, marginBottom: 16 }} />
        <Heading level="heading" as="h3" style={{ marginBottom: 4, textAlign: 'center' }}>{title}</Heading>
        <Text variant="body" tone="muted" style={{ textAlign: 'center', marginBottom: 24, maxWidth: '20rem' }}>{subtitle}</Text>
        <div className="prov-stack prov-stack--sm" style={{ width: '100%' }}>
          {actions.map((action, i) => (
            <ActionRow key={i} onClick={action.onClick} title={action.label} height="3rem" />
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateField(field, value) {
  if (!value || (typeof value === 'string' && !value.trim())) return 'This field is required';
  if (field === 'email' && !validateEmail(value)) return 'Please enter a valid email address';
  if (field === 'seats' && (isNaN(Number(value)) || Number(value) < 1)) return 'Must be at least 1';
  return '';
}

function useForm(initialFields) {
  const [data, setData] = useState(initialFields);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function set(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function blur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, data[field]);
    setErrors(prev => ({ ...prev, [field]: err }));
  }

  // Select-flavoured commit. DS Select is a popover listbox, not a native <select>, so
  // it has no blur to hang validation off — picking an option IS the commit. Validates
  // the incoming value, since `data` hasn't re-rendered yet.
  function pick(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  }

  function validate(requiredFields) {
    const newErrors = {};
    for (const f of requiredFields) {
      const err = validateField(f, data[f]);
      if (err) newErrors[f] = err;
    }
    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(newErrors).length === 0;
  }

  function reset(newData = initialFields) {
    setData(newData);
    setErrors({});
    setTouched({});
  }

  function isValid(requiredFields) {
    return requiredFields.every(f => data[f] && !errors[f]);
  }

  return { data, set, blur, pick, touched, errors, validate, reset, isValid };
}

// DS Select takes [{value,label}] or <option> children; these lists are plain strings.
function toOptions(list) {
  return list.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
}

// ── Type selection step ────────────────────────────────────────────────────────

const TYPE_META = {
  distributor: { label: 'Add Distributor', description: 'Set up a new distribution partner' },
  reseller:    { label: 'Add Reseller',    description: 'Onboard a new reseller into your channel' },
  customer:    { label: 'Add Customer',    description: 'Create a new end customer account' },
};

// The shared `typeConfig` still hands back Tailwind classes (bg-zinc-700, ring-zinc-800…)
// and is consumed by 18 un-converted files, so it isn't safe to change here. The glyph
// (a component, not a class) is still taken from it; the colour is mapped to DS tokens
// locally, reusing the entity mapping already established elsewhere:
// distributor→azure, reseller/partner→rose, customer→emerald.
const TYPE_ACCENT = {
  distributor: A('azure', 600, 400),
  reseller:    A('rose', 600, 400),
  partner:     A('rose', 600, 400),
  customer:    A('emerald', 600, 400),
};

function TypeSelectionStep({ availableTypes, onSelect, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Add Account"
      description="What type of account would you like to add?"
    >
      <div className="prov-stack prov-stack--sm">
        {availableTypes.map(type => {
          // Only the glyph is still taken from the shared typeConfig — its colour classes
          // are Tailwind, so the accent comes from TYPE_ACCENT instead.
          const TypeGlyph = typeConfig[type].Icon;
          const meta = TYPE_META[type];
          const accent = TYPE_ACCENT[type] ?? A('graphite', 600, 400);
          return (
            <ActionRow
              key={type}
              onClick={() => onSelect(type)}
              height="4rem"
              title={meta.label}
              description={meta.description}
              icon={
                <span className="prov-typechip" style={{ '--prov-accent-light': accent.accentLight, '--prov-accent-dark': accent.accentDark }}>
                  <TypeGlyph className="prov-typechip__glyph" />
                </span>
              }
            />
          );
        })}
      </div>
    </Modal>
  );
}

// ── Flow 1: Add Customer ───────────────────────────────────────────────────────

const CUSTOMER_REQUIRED = [
  'subscriptionType', 'customerName', 'companyName', 'address',
  'city', 'stateProvince', 'zip', 'country',
  'contactName', 'email', 'phone',
];

function AddCustomerFlow({ onClose, onSuccess, onSwitchToProduct }) {
  const [step, setStep] = useState(1);
  const form = useForm({
    subscriptionType: '', customerName: '', companyName: '',
    address: '', address2: '', city: '', stateProvince: '', zip: '', country: '',
    contactName: '', email: '', phone: '',
  });

  const displayName = form.data.customerName || form.data.companyName || 'the customer';
  const formIsValid = form.isValid(CUSTOMER_REQUIRED);

  function handleSubmit() {
    if (form.validate(CUSTOMER_REQUIRED)) setStep(2);
  }

  if (step === 2) {
    return (
      <ConfirmationHub
        title="Customer Added"
        subtitle={`${displayName} has been created successfully`}
        onClose={onClose}
        actions={[
          {
            label: 'Add Products',
            onClick: () => onSwitchToProduct(displayName),
          },
          {
            label: 'Add Another Customer',
            onClick: () => {
              form.reset();
              setStep(1);
            },
          },
          {
            label: 'Go to Customer List',
            onClick: () => {
              onSuccess(`${displayName} has been added`);
              onClose();
            },
          },
        ]}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Customer"
      footer={
        <>
          <Button variant="ghost" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formIsValid}>Create Customer</Button>
        </>
      }
    >
      <div className="prov-stack">
        {/* Subscription type + customer name — top row */}
        <div className="prov-grid2">
          <Field label="Subscription Type" error={form.touched.subscriptionType && form.errors.subscriptionType}>
            <Select
              value={form.data.subscriptionType}
              onChange={v => form.pick('subscriptionType', v)}
              placeholder="Select type"
              options={toOptions(['Annual', 'Monthly', 'Prepaid', 'NFR'])}
            />
          </Field>
          <Field label="Customer Name" error={form.touched.customerName && form.errors.customerName}>
            <Input
              value={form.data.customerName}
              onChange={e => form.set('customerName', e.target.value)}
              onBlur={() => form.blur('customerName')}
              placeholder="Display name"
            />
          </Field>
        </div>

        <Heading level="subheading" as="h3" style={{ marginTop: 8 }}>Company Information</Heading>

        <Field label="Company Name" error={form.touched.companyName && form.errors.companyName}>
          <Input value={form.data.companyName} onChange={e => form.set('companyName', e.target.value)} onBlur={() => form.blur('companyName')} placeholder="Legal company name" />
        </Field>
        <Field label="Address" error={form.touched.address && form.errors.address}>
          <Input value={form.data.address} onChange={e => form.set('address', e.target.value)} onBlur={() => form.blur('address')} placeholder="Street address" />
        </Field>
        <Field label={<OptionalLabel>Address 2</OptionalLabel>}>
          <Input value={form.data.address2} onChange={e => form.set('address2', e.target.value)} placeholder="Suite, unit, floor…" />
        </Field>
        <div className="prov-grid2">
          <Field label="City" error={form.touched.city && form.errors.city}>
            <Input value={form.data.city} onChange={e => form.set('city', e.target.value)} onBlur={() => form.blur('city')} placeholder="City" />
          </Field>
          <Field label="State / Province" error={form.touched.stateProvince && form.errors.stateProvince}>
            <Input value={form.data.stateProvince} onChange={e => form.set('stateProvince', e.target.value)} onBlur={() => form.blur('stateProvince')} placeholder="State or province" />
          </Field>
        </div>
        <div className="prov-grid2">
          <Field label="ZIP / Postal Code" error={form.touched.zip && form.errors.zip}>
            <Input value={form.data.zip} onChange={e => form.set('zip', e.target.value)} onBlur={() => form.blur('zip')} placeholder="ZIP or postal code" />
          </Field>
          <Field label="Country" error={form.touched.country && form.errors.country}>
            <Select value={form.data.country} onChange={v => form.pick('country', v)} placeholder="Select country" options={toOptions(COUNTRIES)} />
          </Field>
        </div>

        <Heading level="subheading" as="h3" style={{ marginTop: 8 }}>Primary Contact Information</Heading>

        <Field label="Contact Name" error={form.touched.contactName && form.errors.contactName}>
          <Input value={form.data.contactName} onChange={e => form.set('contactName', e.target.value)} onBlur={() => form.blur('contactName')} placeholder="Full name" />
        </Field>
        <div className="prov-grid2">
          <Field label="Email" error={form.touched.email && form.errors.email}>
            <Input type="email" value={form.data.email} onChange={e => form.set('email', e.target.value)} onBlur={() => form.blur('email')} placeholder="contact@company.com" />
          </Field>
          <Field label="Phone" error={form.touched.phone && form.errors.phone}>
            <Input type="tel" value={form.data.phone} onChange={e => form.set('phone', e.target.value)} onBlur={() => form.blur('phone')} placeholder="+1 (555) 000-0000" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// ── Flow 2: Add Product ────────────────────────────────────────────────────────

function getConfigRequired(productKey) {
  const withPlan = ['tep', 'ies', 'emailcloud', 'complete', 'epmail'];
  if (withPlan.includes(productKey)) return ['siteName', 'billingType', 'seats', 'plan'];
  return ['siteName', 'billingType', 'seats'];
}

function ProductConfigFields({ productKey, customerName, configForm }) {
  const { data, set, blur, pick, touched, errors } = configForm;

  const product = PRODUCTS.find(p => p.key === productKey);
  const withPlan = ['tep', 'ies', 'emailcloud', 'complete', 'epmail'];
  const packageAddOns = PRODUCT_PERMISSIONS_DEF[productKey]?.addOns || [];

  return (
    <div className="prov-stack">
      <Field label="Site Name" error={touched.siteName && errors.siteName}>
        <Input
          value={data.siteName || ''}
          onChange={e => set('siteName', e.target.value)}
          onBlur={() => blur('siteName')}
          placeholder={`${customerName} - ${product?.name || productKey}`}
        />
      </Field>

      <div className="prov-grid2">
        <Field label="Billing Type" error={touched.billingType && errors.billingType}>
          <Select value={data.billingType || ''} onChange={v => pick('billingType', v)} placeholder="Select billing" options={toOptions(['Billed', 'Trial'])} />
        </Field>
        <Field label="Estimated Seats" error={touched.seats && errors.seats}>
          <Input type="number" min="1" value={data.seats || ''} onChange={e => set('seats', e.target.value)} onBlur={() => blur('seats')} placeholder="e.g. 50" />
        </Field>
      </div>

      {withPlan.includes(productKey) && (
        <Field label="Plan" error={touched.plan && errors.plan}>
          <Select value={data.plan || ''} onChange={v => pick('plan', v)} placeholder="Select plan" options={toOptions(['Standard', 'Advanced', 'Premium'])} />
        </Field>
      )}

      {packageAddOns.length > 0 && (
        <Field label={<OptionalLabel>Add-ons</OptionalLabel>}>
          <div className="prov-stack prov-stack--tight">
            {packageAddOns.map(addon => (
              <Checkbox
                key={addon}
                checked={!!(data.addOns || {})[addon]}
                onChange={e => {
                  const next = { ...(data.addOns || {}) };
                  if (e.target.checked) next[addon] = true;
                  else delete next[addon];
                  set('addOns', next);
                }}
              >
                {addon}
              </Checkbox>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}

function AddProductFlow({ onClose, onSuccess, customerName = 'Customer', existingProductKeys = [] }) {
  const [step, setStep] = useState(1);
  const [selectedProductKey, setSelectedProductKey] = useState(null);
  const configForm = useForm({ siteType: '', siteName: '', billingType: '', seats: '', plan: '', addOns: {} });

  const available = PRODUCTS.filter(p => !existingProductKeys.includes(p.key));
  const selectedProduct = PRODUCTS.find(p => p.key === selectedProductKey);
  const configRequired = selectedProductKey ? getConfigRequired(selectedProductKey) : [];
  const configIsValid = configRequired.every(f => configForm.data[f]);

  function handleSelectProduct(key) {
    setSelectedProductKey(key);
    const product = PRODUCTS.find(p => p.key === key);
    configForm.reset({ siteName: `${customerName} - ${product?.name || key}`, billingType: '', seats: '', plan: '', addOns: {} });
  }

  function handleConfigure() {
    if (configForm.validate(configRequired)) setStep(3);
  }

  // Step 1: product selection
  if (step === 1) {
    if (available.length === 0) {
      return (
        <Modal
          open
          onClose={onClose}
          title="Add Product"
          description={customerName ? `Add Product to ${customerName}` : undefined}
          footer={<Button onClick={onClose}>Done</Button>}
        >
          <div className="prov-center" style={{ justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
            <CheckCircle style={{ width: 40, height: 40, color: 'var(--vds-success)', marginBottom: 12 }} />
            <Heading level="subheading" as="p">This customer has all available packages</Heading>
          </div>
        </Modal>
      );
    }

    return (
      <Modal
        open
        onClose={onClose}
        title="Add Package"
        description={customerName ? `Add Package to ${customerName}` : undefined}
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={onClose}>Cancel</Button>
            <Button onClick={() => setStep(2)} disabled={!selectedProductKey}>Next</Button>
          </>
        }
      >
        <div className="prov-stack prov-stack--loose">
          {['IES', 'SafeSend', 'Security'].map(catKey => {
            const group = available.filter(p => p.category === catKey);
            if (group.length === 0) return null;
            return (
              <div key={catKey}>
                <Text variant="eyebrow" tone="subtle" style={{ marginBottom: 8 }}>{catKey}</Text>
                <div className="prov-stack prov-stack--tight">
                  {group.map(product => {
                    const { Icon } = product;
                    const isSelected = selectedProductKey === product.key;
                    return (
                      <button
                        key={product.key}
                        type="button"
                        onClick={() => handleSelectProduct(product.key)}
                        className={isSelected ? 'prov-product prov-product--sel' : 'prov-product'}
                        style={{ '--prov-accent-light': product.accentLight, '--prov-accent-dark': product.accentDark }}
                      >
                        <Icon className="prov-product__icon" />
                        <span className="prov-product__body">
                          <Heading level="subheading" as="span" style={{ display: 'block' }}>{product.name}</Heading>
                          <Text as="span" variant="detail" tone="muted" className="prov-product__desc">{product.description}</Text>
                        </span>
                        <span className="prov-product__mark">
                          {isSelected && <Check style={{ width: 12, height: 12 }} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    );
  }

  // Step 2: product configuration
  if (step === 2 && selectedProduct) {
    return (
      <Modal
        open
        onClose={onClose}
        title={`Configure ${selectedProduct.name}`}
        description={customerName ? `Setting up for ${customerName}` : undefined}
        footer={
          <>
            <Button variant="ghost" tone="neutral" leading={<ArrowLeft style={{ width: 16, height: 16 }} />} onClick={() => setStep(1)}>Back</Button>
            <Button variant="ghost" tone="neutral" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfigure} disabled={!configIsValid}>Add Product</Button>
          </>
        }
      >
        <ProductConfigFields
          productKey={selectedProductKey}
          customerName={customerName}
          configForm={configForm}
        />
      </Modal>
    );
  }

  // Step 3: confirmation
  return (
    <ConfirmationHub
      title="Product Added"
      subtitle={`${selectedProduct?.name ?? 'Product'} has been added to ${customerName}`}
      onClose={onClose}
      actions={[
        {
          label: 'Add Another Product',
          onClick: () => {
            setStep(1);
            setSelectedProductKey(null);
            configForm.reset({ siteType: '', siteName: '', billingType: '', seats: '', plan: '', addOns: {} });
          },
        },
        {
          label: 'View Customer',
          onClick: () => {
            onSuccess(`${selectedProduct?.name} added to ${customerName}`);
            onClose();
          },
        },
        {
          label: 'Go to Customer List',
          onClick: () => {
            onSuccess(`${selectedProduct?.name} added to ${customerName}`);
            onClose();
          },
        },
      ]}
    />
  );
}

// ── Flows 4 & 5: Add Reseller / Add Distributor ────────────────────────────────

const RESELLER_REQUIRED = [
  'companyName', 'address', 'city', 'stateProvince', 'zip', 'country', 'timezone', 'language',
];

function AddPartnerFlow({ entityType, onClose, onSuccess }) {
  const label = entityType === 'distributor' ? 'Distributor' : 'Reseller';
  const [step, setStep] = useState(1);
  const form = useForm({
    companyName: '', address: '', address2: '', city: '', stateProvince: '', zip: '',
    country: '', timezone: 'America/New_York', language: 'English',
  });
  const [permissions, setPermissions] = useState(defaultPermissions);
  const partnerName = form.data.companyName || `the ${label.toLowerCase()}`;
  const formIsValid = form.isValid(RESELLER_REQUIRED);

  function toggleProduct(key) {
    setPermissions(prev => {
      const product = prev[key];
      const def = PRODUCT_PERMISSIONS_DEF[key];
      const newEnabled = !product.enabled;
      return {
        ...prev,
        [key]: {
          enabled: newEnabled,
          addOns: Object.fromEntries(def.addOns.map(a => [a, newEnabled])),
        },
      };
    });
  }

  function toggleAllAddOns(key) {
    setPermissions(prev => {
      const def = PRODUCT_PERMISSIONS_DEF[key];
      const product = prev[key];
      const allChecked = def.addOns.every(a => product.addOns[a]);
      // all → uncheck all; some or none → check all
      const nextAll = !allChecked;
      return {
        ...prev,
        [key]: {
          enabled: true, // keep enabled when toggling add-ons
          addOns: Object.fromEntries(def.addOns.map(a => [a, nextAll])),
        },
      };
    });
  }

  function toggleAddOn(key, addon) {
    setPermissions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        addOns: { ...prev[key].addOns, [addon]: !prev[key].addOns[addon] },
      },
    }));
  }

  function countEnabledProducts() {
    return Object.values(permissions).filter(p => p.enabled).length;
  }

  if (step === 3) {
    const enabledCount = countEnabledProducts();
    return (
      <ConfirmationHub
        title={`${label} Added`}
        subtitle={`${partnerName} has been created and can now provision ${enabledCount} product${enabledCount !== 1 ? 's' : ''}`}
        onClose={onClose}
        actions={[
          {
            label: `Add Another ${label}`,
            onClick: () => {
              form.reset();
              setPermissions(defaultPermissions());
              setStep(1);
            },
          },
          {
            label: `View ${label}`,
            onClick: () => {
              onSuccess(`${partnerName} has been added`);
              onClose();
            },
          },
          {
            label: 'Go to Customer List',
            onClick: () => {
              onSuccess(`${partnerName} has been added`);
              onClose();
            },
          },
        ]}
      />
    );
  }

  if (step === 2) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Select Products"
        description={`Choose the products ${partnerName} is permitted to provision`}
        footer={
          <>
            <Button variant="ghost" tone="neutral" leading={<ArrowLeft style={{ width: 16, height: 16 }} />} onClick={() => setStep(1)}>Back</Button>
            <Button variant="ghost" tone="neutral" onClick={onClose}>Cancel</Button>
            <Button onClick={() => setStep(3)}>Save {label}</Button>
          </>
        }
      >
        <div className="prov-stack prov-stack--loose">
          {Object.entries(PRODUCT_PERMISSIONS_DEF).map(([key, def]) => {
            const product = permissions[key];
            const allAddOnsChecked = def.addOns.length > 0 && def.addOns.every(a => product.addOns[a]);

            return (
              <div key={key} className={product.enabled ? 'prov-permcard' : 'prov-permcard prov-permcard--off'}>
                {/* Product toggle */}
                <Checkbox checked={product.enabled} onChange={() => toggleProduct(key)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <def.Icon className="prov-permicon" style={{ '--prov-accent-light': def.accentLight, '--prov-accent-dark': def.accentDark }} />
                    <Heading level="subheading" as="span">{def.name}</Heading>
                  </span>
                </Checkbox>

                {/* Add-ons */}
                {def.addOns.length > 0 && product.enabled && (
                  <div style={{ marginTop: 12, marginLeft: 24 }}>
                    <div className="prov-eyebrow-row">
                      <Text variant="eyebrow" tone="subtle">Add-ons</Text>
                      <Button variant="ghost" size="xs" onClick={() => toggleAllAddOns(key)}>
                        {allAddOnsChecked ? 'Deselect all' : 'Select all'}
                      </Button>
                    </div>
                    <div className="prov-grid2 prov-grid2--addons">
                      {def.addOns.map(addon => (
                        <Checkbox
                          key={addon}
                          checked={!!product.addOns[addon]}
                          onChange={() => toggleAddOn(key, addon)}
                        >
                          <Text as="span" variant="detail" tone="muted">{addon}</Text>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    );
  }

  // Step 1: partner info
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${label}`}
      footer={
        <>
          <Button variant="ghost" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (form.validate(RESELLER_REQUIRED)) setStep(2); }} disabled={!formIsValid}>Next</Button>
        </>
      }
    >
      <div className="prov-stack">
        <Heading level="subheading" as="h3">Company Information</Heading>

        <Field label="Company Name" error={form.touched.companyName && form.errors.companyName}>
          <Input value={form.data.companyName} onChange={e => form.set('companyName', e.target.value)} onBlur={() => form.blur('companyName')} placeholder="Legal company name" />
        </Field>
        <Field label="Address" error={form.touched.address && form.errors.address}>
          <Input value={form.data.address} onChange={e => form.set('address', e.target.value)} onBlur={() => form.blur('address')} placeholder="Street address" />
        </Field>
        <Field label={<OptionalLabel>Address 2</OptionalLabel>}>
          <Input value={form.data.address2} onChange={e => form.set('address2', e.target.value)} placeholder="Suite, unit, floor…" />
        </Field>
        <div className="prov-grid2">
          <Field label="City" error={form.touched.city && form.errors.city}>
            <Input value={form.data.city} onChange={e => form.set('city', e.target.value)} onBlur={() => form.blur('city')} placeholder="City" />
          </Field>
          <Field label="State / Province" error={form.touched.stateProvince && form.errors.stateProvince}>
            <Input value={form.data.stateProvince} onChange={e => form.set('stateProvince', e.target.value)} onBlur={() => form.blur('stateProvince')} placeholder="State or province" />
          </Field>
        </div>
        <div className="prov-grid2">
          <Field label="ZIP / Postal Code" error={form.touched.zip && form.errors.zip}>
            <Input value={form.data.zip} onChange={e => form.set('zip', e.target.value)} onBlur={() => form.blur('zip')} placeholder="ZIP or postal code" />
          </Field>
          <Field label="Country" error={form.touched.country && form.errors.country}>
            <Select value={form.data.country} onChange={v => form.pick('country', v)} placeholder="Select country" options={toOptions(COUNTRIES)} />
          </Field>
        </div>
        <div className="prov-grid2">
          <Field label="Timezone" error={form.touched.timezone && form.errors.timezone}>
            <Select value={form.data.timezone} onChange={v => form.pick('timezone', v)} options={toOptions(TIMEZONES)} />
          </Field>
          <Field label="Language" error={form.touched.language && form.errors.language}>
            <Select value={form.data.language} onChange={v => form.pick('language', v)} options={toOptions(LANGUAGES)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function AddResellerFlow({ onClose, onSuccess }) {
  return <AddPartnerFlow entityType="reseller" onClose={onClose} onSuccess={onSuccess} />;
}

function AddDistributorFlow({ onClose, onSuccess }) {
  return <AddPartnerFlow entityType="distributor" onClose={onClose} onSuccess={onSuccess} />;
}

// ── Success Toast ──────────────────────────────────────────────────────────────
//
// DS GAP — the DS ships a Toast component, but it expects a ToastProvider/queue this
// prototype doesn't mount, and the shells drive toast state themselves. Kept local and
// token-bound; adopting DS Toast means moving toast ownership into a provider.

export function SuccessToast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="prov-toast animate-palette-in">
      <div className="prov-toast__box">
        <CheckCircle className="prov-toast__icon" />
        <Text style={{ flex: 1 }}>{message}</Text>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="prov-toast__close">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ProvisioningModal({ type: initialType, contextEntity, availableTypes, onClose, onSuccess }) {
  const [activeType, setActiveType] = useState(initialType);
  const [activeCustomerName, setActiveCustomerName] = useState(
    contextEntity?.name ?? null
  );
  const existingProductKeys = contextEntity
    ? Object.keys(contextEntity.products || {})
    : [];

  function switchToProduct(customerName) {
    setActiveCustomerName(customerName);
    setActiveType('addProduct');
  }

  function handleTypeSelect(type) {
    setActiveType('add' + type.charAt(0).toUpperCase() + type.slice(1));
  }

  if (activeType === 'select') {
    return (
      <TypeSelectionStep
        availableTypes={availableTypes || ['customer']}
        onSelect={handleTypeSelect}
        onClose={onClose}
      />
    );
  }

  if (activeType === 'addCustomer') {
    return (
      <AddCustomerFlow
        onClose={onClose}
        onSuccess={onSuccess}
        onSwitchToProduct={switchToProduct}
      />
    );
  }

  if (activeType === 'addProduct') {
    return (
      <AddProductFlow
        onClose={onClose}
        onSuccess={onSuccess}
        customerName={activeCustomerName}
        existingProductKeys={existingProductKeys}
      />
    );
  }

  if (activeType === 'addReseller') {
    return (
      <AddResellerFlow
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (activeType === 'addDistributor') {
    return (
      <AddDistributorFlow
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return null;
}
