import { h, Component } from 'preact';
import style from './footer.less';
import Label from '../label/label';
import CloseButton from '../closebutton/closebutton';
import event_logger from '../../lib/event_logger';

class LocalLabel extends Label {
  static defaultProps = {
    prefix: 'footer'
  };
}

export default class Footer extends Component {

  static defaultProps = {
    onShowConsent: () => {},
  };

  handleClose = () => {
    const { store } = this.props;
    const { toggleFooterShowing } = store;
    toggleFooterShowing(false);
  };

  handleShowConsent = () => {
    const { store } = this.props;
    const { toggleConsentToolShowing } = store;
    toggleConsentToolShowing(true);
  };

  logCloseEvent = () => {
    event_logger('cmp_close');
  }

  render(props) {
    const { store } = props;
    var { isFooterShowing, forceShowUI } = store;

    if (forceShowUI) {
      isFooterShowing = false;
    }

    if (isFooterShowing) {
      this.logCloseEvent();
    }

    return (
      <div
        class={style.footer}
        style={{ display: isFooterShowing ? 'flex' : 'none' }}
        >
        <CloseButton
          hasBorder={false}
          class={style.close}
          onClick={this.handleClose}
        />
        <LocalLabel localizeKey='message' class={style.message}>Open your user privacy preferences</LocalLabel>
        <a
          class={style.openConsent}
          onClick={this.handleShowConsent}
        >
          <LocalLabel localizeKey='consentLink'>here</LocalLabel>
        </a>
      </div>
    );
  }
}
