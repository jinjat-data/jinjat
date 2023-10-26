import { useEffect, useState } from "react";
import { useTranslate, useUpdate } from "@refinedev/core";
import {
    Action,
    createAction,
    Priority,
    useRegisterActions,
} from "@refinedev/kbar";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

export default (): void => {
    const t = useTranslate();

    const [actions, setActions] = useState<Action[]>([]);
    const { mutate } = useUpdate();

    const handleMutate = (status: { id: number; text: string }) => {
        mutate(
            {
                resource: "orders",
                id: 'test',
                values: {
                    status,
                },
            },
            {
                onSuccess: () => setActions([]),
            },
        );
    };
    useEffect(() => {
        const preActions: Action[] = [];
            preActions.push(
                createAction({
                    name: t("buttons.accept"),
                    icon: <CheckOutlined />,
                    section: "actions",
                    perform: () => {
                        handleMutate({
                            id: 2,
                            text: "Ready",
                        });
                    },
                    priority: Priority.HIGH,
                }),
            );
        setActions(preActions);
    }, [order]);
    useRegisterActions(actions, [actions]);
};