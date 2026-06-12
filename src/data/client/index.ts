import type {
  AuthResponse,
  Category,
  CategoryPaginator,
  CategoryQueryOptions,
  ForgetPasswordInput,
  LoginUserInput,
  Order,
  OrderedFilePaginator,
  OrderPaginator,
  OrderQueryOptions,
  PasswordChangeResponse,
  Product,
  ProductPaginator,
  ProductQueryOptions,
  RegisterUserInput,
  ResetPasswordInput,
  Settings,
  Shop,
  ShopPaginator,
  ShopQueryOptions,
  Tag,
  TagPaginator,
  UpdateProfileInput,
  User,
  QueryOptions,
  CreateContactUsInput,
  VerifyForgetPasswordTokenInput,
  ChangePasswordInput,
  PopularProductsQueryOptions,
  CreateOrderInput,
  CheckoutVerificationInput,
  VerifiedCheckoutResponse,
  TopShopQueryOptions,
  Attachment,
  WishlistQueryOption,
  WishlistPaginator,
  Wishlist,
  ReviewQueryOptions,
  Review,
  CreateReviewInput,
  ReviewResponse,
  UpdateReviewInput,
  ReviewPaginator,
  QuestionQueryOptions,
  QuestionPaginator,
  CreateQuestionInput,
  CreateFeedbackInput,
  Feedback,
  CreateAbuseReportInput,
  WishlistQueryOptions,
  MyReportsQueryOptions,
  MyQuestionQueryOptions,
  GetParams,
  SettingsQueryOptions,
  TypeQueryOptions,
  Type,
  PaymentIntentCollection,
  CreateOrderPaymentInput,
  Card,
} from '@/types';
import { API_ENDPOINTS } from './endpoints';
import { HttpClient } from './http-client';
import { FollowedShopsQueryOptions } from '@/types';

class Client {
  products = {
    all: ({
      categories,
      tags,
      name,
      shop_id,
      price,
      ...query
    }: Partial<ProductQueryOptions> = {}) =>
      HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS, {
        searchJoin: 'and',
        with: 'shop',
        orderBy: 'updated_at',
        sortedBy: 'ASC',
        ...query,
        search: HttpClient.formatSearchParams({
          categories,
          tags,
          name,
          shop_id,
          price,
          status: 'publish',
        }),
      }),
    popular: (params: Partial<PopularProductsQueryOptions>) =>
      HttpClient.get<Product[]>(API_ENDPOINTS.PRODUCTS_POPULAR, {
        with: 'shop',
        withCount: 'orders',
        ...params,
      }),
  get: ({ slug, language }: GetParams) =>
    HttpClient.get<Product>(`${API_ENDPOINTS.ELEMENT}/${slug}`, {
      language,
      with: 'shop;tags;type;categories.parent.parent.parent',
      withCount: 'orders',
    }),
    related: ({ slug, language, limit = 8 }: { slug: string; language?: string; limit?: number }) =>
      HttpClient.get<Product[]>(API_ENDPOINTS.PRODUCTS_RELATED, {
        slug,
        language,
        limit,
        with: 'shop',
      }),
    download: (input: { product_id: string }) =>
      HttpClient.post<string>(API_ENDPOINTS.PRODUCTS_FREE_DOWNLOAD, input),
    dynamic: (params: Partial<ProductQueryOptions> = {}) => {
      // Извлекаем attribute_values отдельно, чтобы правильно передать их
      const { attribute_values, ...restParams } = params;
      
      // Сериализуем attribute_values в JSON для передачи через query параметры
      const queryParams: any = {
        searchJoin: 'and',
        with: 'shop;type;categories',
        orderBy: 'updated_at',
        sortedBy: 'DESC',
        ...restParams,
        search: HttpClient.formatSearchParams({
          categories: params.categories,
          tags: params.tags,
          name: params.name,
          shop_id: params.shop_id,
          price: params.price,
          status: 'publish',
        }),
      };
      
      // Добавляем attribute_values если они есть
      if (attribute_values && Object.keys(attribute_values).length > 0) {
        // Сериализуем объект в JSON строку для передачи через GET параметр
        queryParams.attribute_values = JSON.stringify(attribute_values);
      }
      
      return HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS_DYNAMIC, queryParams);
    },
    search: (query: string, params: Partial<ProductQueryOptions> = {}) =>
      HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS_SEARCH, {
        q: query,
        type: 'products', // Указываем тип поиска для Elasticsearch
        with: 'shop;type;categories', // Включаем связанные данные
        ...params,
      }),
    getFilters: () =>
      HttpClient.get<any>(API_ENDPOINTS.PRODUCTS_FILTERS),
    getByGroupKey: (groupKey: string, params?: Partial<ProductQueryOptions>) => {
      // Используем обычный endpoint /products с фильтром по group_key
      // group_key добавлен в fieldSearchable в ProductRepository
      // ВАЖНО: Явно формируем объект параметров, чтобы избежать проблем с сериализацией
      const queryParams: any = {
        searchJoin: 'and',
        with: 'shop;type;categories;attributes',
        orderBy: 'id',
        sortedBy: 'ASC',
        'group_key': groupKey, // Явно указываем group_key в кавычках
        status: 'publish',
        ...params,
      };
      
      return HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS, queryParams);
    },
  };
  categories = {
    all: (query?: CategoryQueryOptions) =>
      HttpClient.get<CategoryPaginator>(API_ENDPOINTS.CATEGORIES, { ...query }),
    get: ({ slug, language }: { slug: string; language?: string }) =>
      HttpClient.get<Category>(`${API_ENDPOINTS.CATEGORIES}/${slug}`, { language }),
    getMenuCategories: (query?: CategoryQueryOptions) =>
      HttpClient.get<Category[]>(`${API_ENDPOINTS.CATEGORIES}/menu`, { ...query }),
    getAttributes: (categoryId: number) =>
      HttpClient.get<any>(`${API_ENDPOINTS.CATEGORY_ATTRIBUTES}/${categoryId}/attributes`),
  };
  tags = {
    all: (query?: QueryOptions) =>
      HttpClient.get<TagPaginator>(API_ENDPOINTS.TAGS, query),
    get: ({ slug, language }: { slug: string; language?: string }) =>
      HttpClient.get<Tag>(`${API_ENDPOINTS.TAGS}/${slug}`, { language }),
  };
  hashtags = {
    all: (query?: QueryOptions) =>
      HttpClient.get<any>(API_ENDPOINTS.HASHTAGS, query),
    get: (slug: string) =>
      HttpClient.get<any>(`${API_ENDPOINTS.HASHTAGS}/${slug}`),
  };
  types = {
    all: (query?: TypeQueryOptions) =>
      HttpClient.get<Type[]>(API_ENDPOINTS.TYPES, { ...query }),
  };
  shops = {
    all: (query?: ShopQueryOptions) =>
      HttpClient.get<ShopPaginator>(API_ENDPOINTS.SHOPS, query),
    my: () =>
      HttpClient.get<Shop[]>(API_ENDPOINTS.MY_SHOPS),
    top: ({ name, ...query }: Partial<TopShopQueryOptions> = {}) =>
      HttpClient.get<ShopPaginator>(API_ENDPOINTS.TOP_SHOPS, {
        searchJoin: 'and',
        // withCount: 'products',
        ...query,
        search: HttpClient.formatSearchParams({
          name,
          is_active: 1,
        }),
      }),
    get: (slug: string) =>
      HttpClient.get<Shop>(`${API_ENDPOINTS.SHOPS}/${slug}`),
  };
  orders = {
    all: (query?: OrderQueryOptions) =>
      HttpClient.get<OrderPaginator>(API_ENDPOINTS.ORDERS, query),
    get: (tracking_number: string) =>
      HttpClient.get<Order>(`${API_ENDPOINTS.ORDERS}/${tracking_number}`),
    downloadable: (query?: OrderQueryOptions) =>
      HttpClient.get<OrderedFilePaginator>(
        API_ENDPOINTS.ORDERS_DOWNLOADS,
        query
      ),
    generateDownloadLink: (digital_file_id: string, name?: string) =>
      HttpClient.post<string>(
        API_ENDPOINTS.GENERATE_DOWNLOADABLE_PRODUCT_LINK,
        {
          digital_file_id,
        }
      ),
    verify: (data: CheckoutVerificationInput) =>
      HttpClient.post<VerifiedCheckoutResponse>(
        API_ENDPOINTS.ORDERS_CHECKOUT_VERIFY,
        data
      ),
    create: (data: CreateOrderInput) =>
      HttpClient.post<Order>(API_ENDPOINTS.ORDERS, data),
    getPaymentIntent: ({
      tracking_number,
      payment_gateway,
      recall_gateway,
    }: {
      tracking_number: string;
      payment_gateway?: string;
      recall_gateway?: boolean;
    }) =>
      HttpClient.get<PaymentIntentCollection>(API_ENDPOINTS.PAYMENT_INTENT, {
        tracking_number,
        payment_gateway,
        recall_gateway,
      }),
    payment: (input: CreateOrderPaymentInput) =>
      HttpClient.post<any>(API_ENDPOINTS.ORDERS_PAYMENT, input),
    savePaymentMethod: (input: any) =>
      HttpClient.post<any>(API_ENDPOINTS.SAVE_PAYMENT_METHOD, input),
    cancel: (tracking_number: string) =>
      HttpClient.post<Order>(`${API_ENDPOINTS.ORDERS_CANCEL}/${tracking_number}/cancel`),
  };
  users = {
    me: () => HttpClient.get<User>(API_ENDPOINTS.USERS_ME),
    update: (user: UpdateProfileInput) =>
      HttpClient.put<User>(`${API_ENDPOINTS.USERS}/${user.id}`, user),
    login: (input: LoginUserInput) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.USERS_LOGIN, input),
    register: (input: RegisterUserInput) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.USERS_REGISTER, input),
    forgotPassword: (input: ForgetPasswordInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_FORGOT_PASSWORD,
        input
      ),
    verifyForgotPasswordToken: (input: VerifyForgetPasswordTokenInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_VERIFY_FORGOT_PASSWORD_TOKEN,
        input
      ),
    resetPassword: (input: ResetPasswordInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_RESET_PASSWORD,
        input
      ),
    changePassword: (input: ChangePasswordInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_CHANGE_PASSWORD,
        input
      ),
    logout: () => HttpClient.post<boolean>(API_ENDPOINTS.USERS_LOGOUT, {}),
    // OTP методы
    sendOtpCode: (input: { phone_number: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.SEND_OTP_CODE, input),
    verifyOtpCode: (input: { otp_id: string; code: string; phone_number: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.VERIFY_OTP_CODE, input),
    otpLogin: (input: { otp_id: string; code: string; phone_number: string; name?: string; email?: string }) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.OTP_LOGIN, input),
    updateContact: (input: { otp_id: string; code: string; phone_number: string; user_id: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.UPDATE_CONTACT, input),
    // PIN code methods
    setPinCode: (input: { pin_code: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.SET_PIN_CODE, input),
    verifyPinCode: (input: { pin_code: string; phone_number: string }) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.VERIFY_PIN_CODE, input),
  };
  questions = {
    all: ({ question, ...params }: QuestionQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.PRODUCTS_QUESTIONS, {
        searchJoin: 'and',
        ...params,
        search: HttpClient.formatSearchParams({
          question,
        }),
      }),

    create: (input: CreateQuestionInput) =>
      HttpClient.post<Review>(API_ENDPOINTS.PRODUCTS_QUESTIONS, input),
  };
  feedback = {
    create: (input: CreateFeedbackInput) =>
      HttpClient.post<Feedback>(API_ENDPOINTS.PRODUCTS_FEEDBACK, input),
  };
  abuse = {
    create: (input: CreateAbuseReportInput) =>
      HttpClient.post<Review>(
        API_ENDPOINTS.PRODUCTS_REVIEWS_ABUSE_REPORT,
        input
      ),
  };
  reviews = {
    all: ({ rating, ...params }: ReviewQueryOptions) =>
      HttpClient.get<ReviewPaginator>(API_ENDPOINTS.PRODUCTS_REVIEWS, {
        searchJoin: 'and',
        with: 'user',
        ...params,
        search: HttpClient.formatSearchParams({
          rating,
        }),
      }),
    get: ({ id }: { id: string }) =>
      HttpClient.get<Review>(`${API_ENDPOINTS.PRODUCTS_REVIEWS}/${id}`),
    create: (input: CreateReviewInput) =>
      HttpClient.post<ReviewResponse>(API_ENDPOINTS.PRODUCTS_REVIEWS, input),
    update: (input: UpdateReviewInput) =>
      HttpClient.put<ReviewResponse>(
        `${API_ENDPOINTS.PRODUCTS_REVIEWS}/${input.id}`,
        input
      ),
  };
  wishlist = {
    all: (params: WishlistQueryOptions) =>
      HttpClient.get<ProductPaginator>(API_ENDPOINTS.USERS_WISHLIST, {
        with: 'shop',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
    toggle: (input: { product_id: string }) =>
      HttpClient.post<{ in_wishlist: boolean }>(
        API_ENDPOINTS.USERS_WISHLIST_TOGGLE,
        input
      ),
    remove: (id: string) =>
      HttpClient.delete<Wishlist>(`${API_ENDPOINTS.WISHLIST}/${id}`),
    checkIsInWishlist: ({ product_id }: { product_id: string }) =>
      HttpClient.get<boolean>(
        `${API_ENDPOINTS.WISHLIST}/in_wishlist/${product_id}`
      ),
  };
  myQuestions = {
    all: (params: MyQuestionQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.MY_QUESTIONS, {
        with: 'user',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
  };
  myReports = {
    all: (params: MyReportsQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.MY_REPORTS, {
        with: 'user',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
  };
  follow = {
    shops: (query?: FollowedShopsQueryOptions) =>
      HttpClient.get<ShopPaginator>(API_ENDPOINTS.FOLLOWED_SHOPS, query),
    isShopFollowed: (input: { shop_id: string }) =>
      HttpClient.get<boolean>(API_ENDPOINTS.FOLLOW_SHOP, input),
    toggle: (input: { shop_id: string }) =>
      HttpClient.post<boolean>(API_ENDPOINTS.FOLLOW_SHOP, input),
    followedShopProducts: (params: Partial<FollowedShopsQueryOptions>) => {
      return HttpClient.get<Product[]>(API_ENDPOINTS.FOLLOWED_SHOPS_PRODUCTS, {
        ...params,
      });
    },
  };
  settings = {
    all: (params?: SettingsQueryOptions) =>
      HttpClient.get<Settings>(API_ENDPOINTS.SETTINGS, { ...params }),
    contactUs: (input: CreateContactUsInput) =>
      HttpClient.post<any>(API_ENDPOINTS.SETTINGS_CONTACT_US, input),
    upload: (input: File[]) => {
      let formData = new FormData();
      input.forEach((attachment) => {
        formData.append('attachment[]', attachment);
      });
      return HttpClient.post<Attachment[]>(API_ENDPOINTS.UPLOADS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  };
  cards = {
    all: (params?: any) =>
      HttpClient.get<Card[]>(API_ENDPOINTS.CARDS, { ...params }),
    remove: ({ id }: { id: string }) =>
      HttpClient.delete<any>(`${API_ENDPOINTS.CARDS}/${id}`),
    addPaymentMethod: (method_key: any) =>
      HttpClient.post<any>(API_ENDPOINTS.CARDS, method_key),
    makeDefaultPaymentMethod: (input: any) =>
      HttpClient.post<any>(API_ENDPOINTS.SET_DEFAULT_CARD, input),
  };
  places = {
    all: (query?: any) =>
      HttpClient.get<any>(API_ENDPOINTS.PLACES, query),
    get: (id: string) =>
      HttpClient.get<any>(`${API_ENDPOINTS.PLACES}/${id}`),
    create: (data: FormData) =>
      HttpClient.post<any>(API_ENDPOINTS.PLACES, data, {
        // ВАЖНО: НЕ устанавливаем Content-Type для FormData - браузер установит автоматически с boundary
        // Если установить вручную, boundary не будет установлен и сервер не сможет распарсить данные
        timeout: 300000, // 5 минут для загрузки видео
      }),
    update: (id: string, data: FormData) => {
      // ВАЖНО: Laravel НЕ умеет обрабатывать PUT с multipart/form-data
      // Используем POST с _method=PUT (Laravel метод spoofing)
      // Это добавляется в FormData перед вызовом
      return HttpClient.post<any>(`${API_ENDPOINTS.PLACES}/${id}`, data, {
        // ВАЖНО: НЕ устанавливаем Content-Type для FormData - браузер установит автоматически с boundary
        timeout: 300000, // 5 минут для загрузки видео
      });
    },
    delete: (id: string) =>
      HttpClient.delete<any>(`${API_ENDPOINTS.PLACES}/${id}`),
    searchProducts: (query: { q: string; limit?: number; shop_id?: string }) =>
      HttpClient.get<any>(`${API_ENDPOINTS.PLACES}/search/products`, query),
  };
  placeLike = {
    toggle: (input: { place_id: string }) =>
      HttpClient.post<{ liked: boolean; likes_count: number }>(
        `${API_ENDPOINTS.PLACE_LIKE}/toggle/${input.place_id}`,
        {}
      ),
    check: (input: { place_id: string }) => {
      if (!input.place_id || input.place_id === 'undefined' || input.place_id === 'null' || input.place_id === '' || isNaN(Number(input.place_id)) || Number(input.place_id) <= 0) {
        // Заглушка для невалидных place_id - возвращаем Promise с дефолтным значением
        return Promise.resolve({ liked: false });
      }
      return HttpClient.get<{ liked: boolean }>(
        `${API_ENDPOINTS.PLACE_LIKE}/check/${input.place_id}`
      );
    },
    likers: (input: { place_id: string; page?: number }) =>
      HttpClient.get<any>(
        `${API_ENDPOINTS.PLACE_LIKE}/likers/${input.place_id}`,
        { page: input.page || 1 }
      ),
    my: (params?: any) =>
      HttpClient.get<any>(API_ENDPOINTS.MY_PLACE_LIKES, params),
  };
  placeComments = {
    all: (input: { place_id: string; page?: number; limit?: number }) =>
      HttpClient.get<any>(
        `${API_ENDPOINTS.PLACE_COMMENTS}/${input.place_id}/comments`,
        { page: input.page || 1, limit: input.limit || 20 }
      ),
    create: (input: { place_id: string; comment: string; parent_id?: string }) =>
      HttpClient.post<any>(
        `${API_ENDPOINTS.PLACE_COMMENTS}/${input.place_id}/comments`,
        { comment: input.comment, parent_id: input.parent_id }
      ),
    update: (input: { place_id: string; comment_id: string; comment: string }) =>
      HttpClient.put<any>(
        `${API_ENDPOINTS.PLACE_COMMENTS}/${input.place_id}/comments/${input.comment_id}`,
        { comment: input.comment }
      ),
    delete: (input: { place_id: string; comment_id: string }) =>
      HttpClient.delete<any>(
        `${API_ENDPOINTS.PLACE_COMMENTS}/${input.place_id}/comments/${input.comment_id}`
      ),
  };
  placeWishlist = {
    all: (params: any) =>
      HttpClient.get<PlacePaginator>(API_ENDPOINTS.USERS_PLACE_WISHLIST, {
        with: 'user',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
    toggle: (input: { place_id: string }) =>
      HttpClient.post<{ in_wishlist: boolean }>(
        API_ENDPOINTS.USERS_PLACE_WISHLIST_TOGGLE,
        input
      ),
    remove: (id: string) =>
      HttpClient.delete<any>(`${API_ENDPOINTS.PLACE_WISHLIST}/${id}`),
    checkIsInWishlist: ({ place_id }: { place_id: string }) =>
      HttpClient.get<boolean>(
        `${API_ENDPOINTS.PLACE_WISHLIST}/in_wishlist/${place_id}`
      ),
  };
  // Chat API
  chat = {
    conversations: () =>
      HttpClient.get<any>(API_ENDPOINTS.CHAT_CONVERSATIONS),
    conversation: (id: string) =>
      HttpClient.get<any>(`${API_ENDPOINTS.CHAT_CONVERSATIONS}/${id}`),
    sendMessage: (data: {
      conversation_id?: string;
      recipient_id?: string;
      body?: string;
      attachments?: File[];
    }) => {
      const formData = new FormData();
      if (data.conversation_id) {
        formData.append('conversation_id', data.conversation_id);
      }
      if (data.recipient_id) {
        formData.append('recipient_id', data.recipient_id);
      }
      if (data.body) {
        formData.append('body', data.body);
      }
      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append('attachments[]', file);
        });
      }
      return HttpClient.post<any>(API_ENDPOINTS.CHAT_MESSAGES, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    uploadAttachment: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return HttpClient.post<any>(API_ENDPOINTS.CHAT_ATTACHMENTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    markAsRead: (conversationId: string) =>
      HttpClient.post<any>(
        `${API_ENDPOINTS.CHAT_CONVERSATIONS}/${conversationId}/read`,
        {}
      ),
  };
  // Auth API
  auth = {
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.AUTH_REGISTER, data),
    login: (data: { email: string; password: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.AUTH_LOGIN, data),
    logout: () =>
      HttpClient.post<any>(API_ENDPOINTS.AUTH_LOGOUT, {}),
    me: () =>
      HttpClient.get<any>(API_ENDPOINTS.AUTH_ME),
  };
}

export default new Client();
