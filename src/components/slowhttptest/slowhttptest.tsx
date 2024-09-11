import { Button, Stack, TextInput, NativeSelect } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState, useEffect } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { checkAllCommandsAvailability } from "../../utils/CommandAvailability";
import InstallationModal from "../InstallationModal/InstallationModal";
import { RenderComponent } from "../UserGuide/UserGuide";

/**
 * Represents the form values for the Slowhttptest component.
 */
interface FormValuesType {
    url: string;
    attackType: string;
    rate: string;
    connections: string;
    duration: string;
    length: string;
    contentLength: string;
    timeout: string;
    readTimeout: string;
}

/**
 * The Slowhttptest component.
 * @returns The Slowhttptest component.
 */
const Slowhttptest = () => {
    // State variables
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [pid, setPid] = useState("");
    const [allowSave, setAllowSave] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [isCommandAvailable, setIsCommandAvailable] = useState(false);
    const [opened, setOpened] = useState(!isCommandAvailable);
    const [loadingModal, setLoadingModal] = useState(true);

    // Component Constants
    const title = "Slowhttptest Generator";
    const description =
        "Slowhttptest is a tool used to simulate slow HTTP DoS attacks by sending partial HTTP requests, " +
        "which can consume server resources and exhaust the maximum concurrent connection pool. " +
        "Configure the parameters and click Generate to run the test.";
    const steps =
        "Step 1: Configure the attack parameters.\n" +
        "Step 2: Click Generate to start the test.";
    const sourceLink = "https://github.com/example/slowhttptest";
    const tutorial = "https://example.com/tutorial";
    const dependencies = ["slowhttptest"];

    // Form hook to handle input
    const form = useForm<FormValuesType>({
        initialValues: {
            url: "",
            attackType: "",
            rate: "",
            connections: "",
            duration: "",
            length: "",
            contentLength: "",
            timeout: "",
            readTimeout: "",
        },
    });

    // Check the availability of the Slowhttptest command.
    useEffect(() => {
        checkAllCommandsAvailability(dependencies)
            .then((isAvailable) => {
                setIsCommandAvailable(isAvailable);
                setOpened(!isAvailable);
                setLoadingModal(false);
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                setLoadingModal(false);
            });
    }, []);

    /**
     * Handles data generated by the executing process into the output state variable.
     */
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data);
        setAllowSave(true);
    }, []);

    /**
     * Handles the termination of the process, resetting state variables and informing the user.
     */
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            setPid("");
            setLoading(false);
        },
        [handleProcessData]
    );

    /**
     * Recognizes that the output file has been saved.
     */
    const handleSaveComplete = useCallback(() => {
        setHasSaved(true);
        setAllowSave(false);
    }, []);

    /**
     * Asynchronous handler for the form submission event.
     */
    const onSubmit = async (values: FormValuesType) => {
        setAllowSave(false);
        setLoading(true);

        const args = [
            `-u ${values.url}`,
            `-r ${values.rate}`,
            `-t ${values.connections}`,
            `-l ${values.duration}`,
            `-L ${values.length}`,
            `-H "Content-Length: ${values.contentLength}"`,
            `-T ${values.timeout}`,
            `-X ${values.readTimeout}`,
        ];

        if (values.attackType) {
            args.push(`-c ${values.attackType}`);
        }

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "slowhttptest",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(`Error: ${e.message}`);
        }
    };

    /**
     * Clears the console output.
     */
    const clearOutput = useCallback(() => {
        setOutput("");
        setHasSaved(false);
        setAllowSave(false);
    }, []);

    return (
        <RenderComponent
            title={title}
            description={description}
            steps={steps}
            tutorial={tutorial}
            sourceLink={sourceLink}
        >
            {!loadingModal && (
                <InstallationModal
                    isOpen={opened}
                    setOpened={setOpened}
                    feature_description={description}
                    dependencies={dependencies}
                />
            )}
            <form onSubmit={form.onSubmit(onSubmit)}>
                {LoadingOverlayAndCancelButton(loading, pid)}
                <Stack>
                    <NativeSelect
                        label="Attack Type"
                        placeholder="Select Attack Type"
                        {...form.getInputProps("attackType")}
                        data={[
                            { value: "", label: "Select Attack Type" },
                            { value: "slowloris", label: "Slowloris" },
                            { value: "slowbody", label: "Slowbody" },
                            { value: "slowread", label: "Slowread" },
                            { value: "range", label: "Range" }
                        ]}
                    />

                    <TextInput
                        label="Target URL"
                        placeholder="Enter target URL, e.g., http://target.com"
                        {...form.getInputProps("url")}
                        required
                    />

                    <TextInput
                        label="Request Rate (rps)"
                        placeholder="Enter request rate per second, e.g., 200"
                        {...form.getInputProps("rate")}
                    />

                    <TextInput
                        label="Number of Connections"
                        placeholder="Enter number of connections, e.g., 1000"
                        {...form.getInputProps("connections")}
                    />

                    <TextInput
                        label="Test Duration (sec)"
                        placeholder="Enter test duration in seconds, e.g., 60"
                        {...form.getInputProps("duration")}
                    />

                    <TextInput
                        label="Length of the Request"
                        placeholder="Enter length of the request, e.g., 1000"
                        {...form.getInputProps("length")}
                    />

                    <TextInput
                        label="Content-Length Header"
                        placeholder="Enter Content-Length header value, e.g., 500"
                        {...form.getInputProps("contentLength")}
                    />

                    <TextInput
                        label="Connection Timeout (sec)"
                        placeholder="Enter connection timeout in seconds, e.g., 30"
                        {...form.getInputProps("timeout")}
                    />

                    <TextInput
                        label="Read Timeout (sec)"
                        placeholder="Enter read timeout in seconds, e.g., 60"
                        {...form.getInputProps("readTimeout")}
                    />

                    <Button type="submit">Start {title}</Button>
                    {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                    <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
                </Stack>
            </form>
        </RenderComponent>
    );
};

export default Slowhttptest;
