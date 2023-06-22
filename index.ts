
enum Roles {
  USER = 'user',
  ADMIN = 'admin'
}

interface IRequestBody {
  name: string;
  age: number;
  roles: Roles[];
  createdAt: Date;
  isDeleted: boolean;
}

interface IRequestParams {
  id?: string;
}

interface IRequest {
  method: string;
  host: string;
  path: string;
  body?: IRequestBody;
  params?: IRequestParams;
}

interface IHandlers {
  next: (value: IRequest) => void;
  error: (error?: string) => void;
  complete: () => void;
}

interface Unsubscribe {
  unsubscribe: () => void;
}

interface ObserverType extends IHandlers {
  handlers?: IHandlers;
  isUnsubscribed?: boolean;
  _unsubscribe?: Function;
}

interface ObservableType {
  _subscribe: subscribeType;
}

type subscribeType = (observer: ObserverType) => Function;
type ObserverWithUnsubscribeType = ObserverType & Unsubscribe;

class Observer implements ObserverWithUnsubscribeType {
  handlers: IHandlers;
  isUnsubscribed: boolean;
  _unsubscribe?: Function;

  constructor(handlers: IHandlers) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: IRequest) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error?: string) {
    console.log('error triggered');

    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        console.log(error);
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable implements ObservableType {
  _subscribe: subscribeType;

  constructor(subscribe: subscribeType) {
    this._subscribe = subscribe;
  }

  static from(values: IRequest[]) {
    return new Observable((observer: ObserverType): Function => {
      values.forEach((value) => observer.next(value));

      observer.complete();
      observer.error('Error occurred'); // Pass an error message or object

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: ObserverType) {
    const observer: ObserverWithUnsubscribeType = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      }
    };
  }
}

const HTTP_POST_METHOD = 'POST';
const HTTP_GET_METHOD = 'GET';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const userMock: IRequestBody = {
  name: 'User Name',
  age: 26,
  roles: [Roles.USER, Roles.ADMIN],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: IRequest[] = [
  {
    method: HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {}
  },
  {
    method: HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s'
    }
  }
];

const handleRequest = (request: IRequest): { status: number } => {
  // handling of request
  return { status: HTTP_STATUS_OK };
};

const handleError = (error?: any): { status: number } => {
  // handling of error
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log('complete');

const requests$ = Observable.from(requestsMock);

const handlers: IHandlers = {
  next: handleRequest,
  error: handleError,
  complete: handleComplete
};

const subscription = requests$.subscribe(handlers);

subscription.unsubscribe();