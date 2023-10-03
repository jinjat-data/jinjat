import {
    BaseRecord,
    HttpError,
    useHandleNotification,
    useOnError,
    useResourceSubscription,
    useTranslate
} from "@refinedev/core";
import {QueryKey, QueryObserverResult, useQuery} from "@tanstack/react-query";
import {JsonSchema} from "@jsonforms/core";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {Type, UseSchemaProps} from "@components/hooks/useSchema";

export const useJinjatQuery = <TData extends BaseRecord = BaseRecord,
    TError extends HttpError = HttpError,
>({
      resource,
      config,
      queryOptions,
      successNotification,
      errorNotification,
      metaData,
  }: UseSchemaProps<TData, TError>): QueryObserverResult<JsonSchema,
    TError> => {
    const schemaProvider = useJinjatProvider();
    const translate = useTranslate();

    const {mutate: checkError} = useOnError({
        v3LegacyAuthProviderCompatible: true
    });
    const handleNotification = useHandleNotification();

    useResourceSubscription({
        resource,
        types: ["*"],
        channel: `resources/${resource}`,
    });

    const queryResponse = useQuery<JsonSchema, TError>(
        [{...config, ...metaData}] as QueryKey,
        ({queryKey, pageParam, signal}) => {
            const [packageName, analysis] = resource.split('.', 2)
            let params = {
                packageName: packageName,
                analysis: analysis,
            };
            debugger

            if (config?.type == Type.REQUEST) {
                return schemaProvider.getRequestSchema(params);
            } else if (config?.type == Type.RESPONSE) {
                return schemaProvider.getResponseSchema(params);
            } else {
                throw Error(`Invalid useSchema type? ${config?.type}`)
            }
        },
        {
            ...queryOptions,
            onSuccess: (data) => {
                queryOptions?.onSuccess?.(data);

                const notificationConfig =
                    typeof successNotification === "function"
                        ? successNotification(
                            data,
                            {meta: metaData, config},
                            resource,
                        )
                        : successNotification;

                handleNotification(notificationConfig);
            },
            onError: (err: TError) => {
                checkError(err);
                queryOptions?.onError?.(err);

                const notificationConfig =
                    typeof errorNotification === "function"
                        ? errorNotification(err, {meta: metaData, config}, resource)
                        : errorNotification;

                handleNotification(notificationConfig, {
                    key: `${resource}-useSchema-notification`,
                    message: translate(
                        "notifications.error",
                        {statusCode: err.statusCode},
                        `Error (status code: ${err.statusCode})`,
                    ),
                    description: err.message,
                    type: "error",
                });
            },
        },
    );

    return queryResponse;
};