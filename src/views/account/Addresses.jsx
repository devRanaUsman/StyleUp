import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Badge, Button, Checkbox, Input, Select, Notice } from "../../components/ui";
import { Modal, toast } from "../../components/ui/Overlays";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import authService from "../../services/authService";
import { authActions } from "../../store/authSlice";
import { COUNTRIES } from "../../data/catalog";
import AccountLayout from "./AccountLayout";

const schema = { label: [rules.required("Label")], firstName: [rules.required("First name")], lastName: [rules.required("Last name")], address1: [rules.required("Address")], city: [rules.required("City")], state: [rules.required("State / region")], postal: [rules.required("Postal code"), rules.postal()], country: [rules.required("Country")] };
const EMPTY = { label: "Home", firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", postal: "", country: "United States", isDefault: false };

function AddressForm({ initial, onSave, onCancel }) {
  const f = useForm({ ...EMPTY, ...initial }, schema);
  return (
    <form className="form-grid form-grid--2" noValidate onSubmit={f.handleSubmit(onSave)}>
      {f.formError&&<Notice className="span-2" tone="error" role="alert">{f.formError}</Notice>}
      <Input className="span-2" label="Label" placeholder="Home, Work…" {...f.field("label")} error={f.error("label")} />
      <Input label="First name" autoComplete="given-name" {...f.field("firstName")} error={f.error("firstName")} />
      <Input label="Last name" autoComplete="family-name" {...f.field("lastName")} error={f.error("lastName")} />
      <Input className="span-2" label="Address" autoComplete="address-line1" {...f.field("address1")} error={f.error("address1")} />
      <Input className="span-2" label="Apartment, suite, etc." optional {...f.field("address2")} />
      <Input label="City" {...f.field("city")} error={f.error("city")} />
      <Input label="State / region" {...f.field("state")} error={f.error("state")} />
      <Input label="Postal code" {...f.field("postal")} error={f.error("postal")} />
      <Select label="Country" options={COUNTRIES} {...f.field("country")} error={f.error("country")} />
      <div className="span-2"><Checkbox label="Set as default shipping address" name="isDefault" checked={f.values.isDefault} onChange={f.field("isDefault").onChange} /></div>
      <div className="row span-2"><Button type="submit" loading={f.submitting}>Save address</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </form>
  );
}

export default function Addresses() {
  useSeo({ title: "Saved addresses", noindex: true });
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(null); // null | "new" | address
  const list = user?.addresses || [];
  const persist = async (addresses, msg) => { const u = await authService.saveAddresses(user.id, addresses); dispatch(authActions.setUser(u)); toast(dispatch, msg, { type: "success" }); setEditing(null); };
  const save = async (v) => { let next; if (editing === "new") next = [...list, { ...v, id: `a_${Date.now()}` }]; else next = list.map((a) => (a.id === editing.id ? { ...a, ...v } : a)); if (v.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === (editing === "new" ? next[next.length - 1].id : editing.id) })); if (!next.some((a) => a.isDefault)) next[0].isDefault = true; await persist(next, editing === "new" ? "Address added" : "Address updated"); };
  const reportError = e => toast(dispatch, e.message, {type:'error'});
  const remove = (a) => { if (!confirm(`Delete the "${a.label}" address?`)) return; let next = list.filter((x) => x.id !== a.id); if (a.isDefault && next.length) next = next.map((x, i) => ({ ...x, isDefault: i === 0 })); persist(next, "Address removed").catch(reportError); };
  const setDefault = (a) => persist(list.map((x) => ({ ...x, isDefault: x.id === a.id })), "Default address updated").catch(reportError);
  return (
    <AccountLayout crumbs={[{ label: "Addresses", to: "/account/addresses" }]}>
      <div className="acct__welcome"><h1 className="h2" style={{ fontSize: "var(--fs-h3)" }}>Saved addresses</h1><Button size="sm" icon="plus" onClick={() => setEditing("new")}>Add address</Button></div>
      {list.length === 0 ? <div className="empty" style={{ padding: "32px 0" }}><div className="empty__icon"><Icon name="mapPin" size={26} /></div><h2 className="h3">No saved addresses</h2><p>Save an address to check out faster next time.</p><div className="empty__actions"><Button onClick={() => setEditing("new")}>Add your first address</Button></div></div> : (
        <div className="addr-grid">{list.map((a) => <div key={a.id} className={`addr-card ${a.isDefault ? "is-default" : ""}`}>{a.isDefault && <Badge tone="success" className="addr-card__badge">Default</Badge>}<b>{a.label}</b><p>{a.firstName} {a.lastName}<br />{a.address1}{a.address2 && <>, {a.address2}</>}<br />{a.city}, {a.state} {a.postal}<br />{a.country}</p><div className="addr-card__actions"><button type="button" onClick={() => setEditing(a)}>Edit</button>{!a.isDefault && <button type="button" onClick={() => setDefault(a)}>Set as default</button>}<button type="button" className="danger" onClick={() => remove(a)}>Delete</button></div></div>)}</div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add address" : "Edit address"} width="640px">{editing && <AddressForm initial={editing === "new" ? {} : editing} onSave={save} onCancel={() => setEditing(null)} />}</Modal>
    </AccountLayout>
  );
}
