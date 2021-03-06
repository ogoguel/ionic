import { RouterDirection } from '@ionic/core';
import { NavContext, NavContextState } from '@ionic/react';
import { Location as HistoryLocation, UnregisterCallback } from 'history';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { generateId } from '../utils';
import { LocationHistory } from '../utils/LocationHistory';

import { StackManager } from './StackManager';
import { ViewItem } from './ViewItem';
import { ViewStack } from './ViewStacks';

interface NavManagerProps extends RouteComponentProps {
  findViewInfoByLocation: (location: HistoryLocation) => { view?: ViewItem, viewStack?: ViewStack };
  findViewInfoById: (id: string) => { view?: ViewItem, viewStack?: ViewStack };
  getActiveIonPage: () => { view?: ViewItem, viewStack?: ViewStack };
}

export class NavManager extends React.Component<NavManagerProps, NavContextState> {

  listenUnregisterCallback: UnregisterCallback | undefined;
  locationHistory: LocationHistory = new LocationHistory();

  constructor(props: NavManagerProps) {
    super(props);
    this.state = {
      goBack: this.goBack.bind(this),
      hasIonicRouter: () => true,
      getHistory: this.getHistory.bind(this),
      getLocation: this.getLocation.bind(this),
      navigate: this.navigate.bind(this),
      getStackManager: this.getStackManager.bind(this),
      getPageManager: this.getPageManager.bind(this),
      currentPath: this.props.location.pathname,
      registerIonPage: () => { return; } // overridden in View for each IonPage
    };

    this.listenUnregisterCallback = this.props.history.listen((location: HistoryLocation) => {
      this.setState({
        currentPath: location.pathname
      });
      this.locationHistory.add(location);
    });

    this.locationHistory.add({
      hash: window.location.hash,
      key: generateId(),
      pathname: window.location.pathname,
      search: window.location.search,
      state: {}
    });
  }

  componentWillUnmount() {
    if (this.listenUnregisterCallback) {
      this.listenUnregisterCallback();
    }
  }

  goBack(defaultHref?: string) {
    const { view: activeIonPage } = this.props.getActiveIonPage();
    if (activeIonPage) {
      const { view: enteringView } = this.props.findViewInfoById(activeIonPage.prevId!);
      if (enteringView) {
        const lastLocation = this.locationHistory.findLastLocation(enteringView.routeData.match.url);
        if (lastLocation) {
          this.props.history.replace(lastLocation.pathname + lastLocation.search, { direction: 'back' });
        } else {
          this.props.history.replace(enteringView.routeData.match.url, { direction: 'back' });
        }
      } else {
        if (defaultHref) {
          this.props.history.replace(defaultHref, { direction: 'back' });
        }
      }
    } else {
      if (defaultHref) {
        this.props.history.replace(defaultHref, { direction: 'back' });
      }
    }
  }

  getHistory() {
    return this.props.history as any;
  }

  getLocation() {
    return this.props.location as any;
  }

  navigate(path: string, direction?: RouterDirection | 'none') {
    this.props.history.push(path, { direction });
  }

  getPageManager() {
    return (children: any) => children;
  }

  getStackManager() {
    return StackManager;
  }

  render() {
    return (
      <NavContext.Provider value={this.state}>
        {this.props.children}
      </NavContext.Provider>
    );
  }

}
