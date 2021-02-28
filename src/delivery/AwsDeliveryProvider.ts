import { ApiGatewayManagementApi } from 'aws-sdk';
import { SocketResponse } from '../helpers/Interfaces';
import { DeliveryProviderInterface } from "./DeliveryProviderInterface";
import { Connection } from "../models";

export class AwsDeliveryProvider implements DeliveryProviderInterface {

    public static apiUrl = "";

    public sendMessage = async (connection: Connection, data: SocketResponse) => {
        const apigwManagementApi = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: AwsDeliveryProvider.apiUrl });
        var success = true;
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connection.socketId, Data: JSON.stringify(data) }).promise();
        } catch { success = false; }
        return success;
    }


}