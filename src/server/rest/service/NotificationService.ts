import { Action, Entity } from '../../../types/Authorization';
import { NextFunction, Request, Response, request } from 'express';

import AppAuthError from '../../../exception/AppAuthError';
import Authorizations from '../../../authorization/Authorizations';
import Constants from '../../../utils/Constants';
import { EndUserErrorNotification } from '../../../types/UserNotifications';
import { HTTPAuthError } from '../../../types/HTTPError';
import Logging from '../../../utils/Logging';
import NotificationHandler from '../../../notification/NotificationHandler';
import NotificationSecurity from './security/NotificationSecurity';
import NotificationStorage from '../../../storage/mongodb/NotificationStorage';
import { ServerAction } from '../../../types/Server';
import UserStorage from '../../../storage/mongodb/UserStorage';
import Utils from '../../../utils/Utils';
import UtilsService from './UtilsService';

const MODULE_NAME = 'NotificationService';

export default class NotificationService {
  static async handleGetNotifications(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Filter
      const filteredRequest = NotificationSecurity.filterNotificationsRequest(req.query);
      // Get the Notification
      const notifications = await NotificationStorage.getNotifications(req.user.tenantID, {
        'userID': filteredRequest.UserID,
        'dateFrom': filteredRequest.DateFrom,
        'channel': filteredRequest.Channel
      }, {
        limit: filteredRequest.Limit,
        skip: filteredRequest.Skip,
        sort: filteredRequest.Sort
      });
      // Filter
      NotificationSecurity.filterNotificationsResponse(notifications, req.user);
      // Return
      res.json(notifications);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleEndUserErrorNotification(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check auth
    if (!Authorizations.canSendEndUserErrorNotification(req.user)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.CREATE, entity: Entity.NOTIFICATION,
        module: MODULE_NAME, method: 'handleEndUserErrorNotification'
      });
    }
    // Filter
    const filteredRequest = NotificationSecurity.filterEndUserErrorNotificationRequest(req.body);
    // Get the User
    const user = await UserStorage.getUser(req.user.tenantID, req.user.id);
    UtilsService.assertObjectExists(action, user, `User '${req.user.id}' does not exist`,
      MODULE_NAME, 'handleEndUserErrorNotification', req.user);
    // Save mobile number
    if (filteredRequest.phone && (user.mobile !== filteredRequest.phone)) {
      user.mobile = filteredRequest.phone;
      await UserStorage.saveUserMobilePhone(req.user.tenantID, user.id, { mobile: filteredRequest.phone });
    }
    // Set
    const endUserErrorNotification: EndUserErrorNotification = {
      userID: user.id,
      email: user.email,
      phone: user.mobile,
      name: Utils.buildUserFullName(user, false, false),
      errorTitle: filteredRequest.errorTitle,
      errorDescription: filteredRequest.errorDescription,
      evseDashboardURL: Utils.buildEvseURL(),
    };
    // Check if Notification is valid
    Utils.checkIfEndUserErrorNotificationValid(filteredRequest, req);
    // Send Notification
    await NotificationHandler.sendEndUserErrorNotification(req.user.tenantID, endUserErrorNotification);
    // Ok
    res.json(Constants.REST_RESPONSE_SUCCESS);
    next();
  }
}

