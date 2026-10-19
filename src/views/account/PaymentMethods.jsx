import AccountLayout from './AccountLayout';
import Icon from '../../components/ui/Icon';
import { Badge, Button } from '../../components/ui';
import { useSeo } from '../../hooks/useSeo';
export default function PaymentMethods(){
  useSeo({title:'Payment methods',noindex:true});
  return <AccountLayout title="Payment methods" crumbs={[{label:'Payment methods',to:'/account/payment-methods'}]}>
    <section className="card payment-panel" aria-labelledby="payment-title">
      <div className="payment-panel__header"><span className="tile__icon"><Icon name="truck" size={22}/></span><Badge tone="success">Available</Badge></div>
      <div><h2 className="h3" id="payment-title">Cash on delivery</h2><p className="muted">Pay when your order arrives. No card details are needed at checkout.</p></div>
      <div className="notice"><Icon name="info" size={20}/><p>Online payments and saved cards are not currently available. Your order’s payment status is shown in its details.</p></div>
      <div className="row" style={{flexWrap:'wrap'}}><Button variant="secondary" to="/account/orders">View my orders</Button><Button variant="tertiary" to="/contact">Payment help</Button></div>
    </section>
  </AccountLayout>;
}
