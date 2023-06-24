import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

@Catch(WsException, HttpException)
export class WebsocketExceptionsFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as WebSocket;
    const data = host.switchToWs().getData();
    const error = exception instanceof WsException ? exception.getError() : exception.getResponse();
    const details = error instanceof Object ? { ...error } : { message: error };
    client.send(JSON.stringify({
      event: "error",
      data: {
        id: (client as any).id,
        rid: data.rid,
        ...details
      }
    }));
  }
}