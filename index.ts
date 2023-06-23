
enum Roles {
  USER = 'user',
  ADMIN = 'admin'
}

enum HTTP {
  POST_METHOD = 'POST',
  GET_METHOD = 'GET',

  STATUS_OK = 200,
  STATUS_INTERNAL_SERVER_ERROR = 500
}

type StatusOk = {
  status: HTTP.STATUS_OK
}

type StatusInernalError = {
  status: HTTP.STATUS_INTERNAL_SERVER_ERROR
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
  method: HTTP.POST_METHOD | HTTP.GET_METHOD;
  host: string;
  path: string;
  body?: IRequestBody;
  params?: IRequestParams;
}

interface IHandlers {
  next: (value: IRequest) => void;
  error: (error?: Error) => void;
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

  error(error?: Error) {
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


const userMock: IRequestBody = {
  name: 'User Name',
  age: 26,
  roles: [Roles.USER, Roles.ADMIN],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: IRequest[] = [
  {
    method: HTTP.POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {}
  },
  {
    method: HTTP.GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s'
    }
  }
];

const handleRequest = (request: IRequest) => {
  // handling of request
  return { status: HTTP.STATUS_OK };
};

const handleError = (error?: Error) => {
  // handling of error
  return { status: HTTP.STATUS_INTERNAL_SERVER_ERROR };
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