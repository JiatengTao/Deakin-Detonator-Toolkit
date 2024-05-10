import { Button, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState, useEffect } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { URenderComponent } from "../UserGuide/UserGuide";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
mport { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import { checkAllCommandsAvailability } from "../../utils/CommandAvailability";
import InstallationModal from "../InstallationModal/InstallationModal";

const title = "Shodan API Tool";
const description_userguide =
    "The Shodan API is a powerful tool that allows external network scans to be performed with " +
    "use of a valid API key. This key is obtained through account creation within Shodan; see the " +
    "below link to create an account:\n\nShodan Account Creation: " +
    "https://developer.shodan.io/api/requirements\n\nHow to use Shodan API:\n\n" +
    "Step 1: Enter a Valid API Key - Note; See above for account creation to " +
    "receive API Key.\n       E.g. PLACEHOLDER\n\nStep 2: Enter a Host IP.\n       " +
    "E.g. 127.0.0.1\n\n" +
    "Step 3: Click Scan to commence the Shodan API operation.\n\n" +
    "Step 4: View the Output block below to view the results of the tool's execution.";

interface FormValuesType {
    hostIP: string;
    shodanKey: string;
}

/**
 * The Shodan API Tool component.
 * @returns The Shodan component.
 */
export function ShodanAPITool() {
    const [loading, setLoading] = useState(false); // State variable to indicate loading state.
    const [output, setOutput] = useState(""); // State variable to store the output of the command execution.
    const [pid, setPid] = useState(""); // State variable to store the process ID of the command execution.
    const [allowSave, setAllowSave] = useState(false); // State variable to allow saving the output to a file.
    const [hasSaved, setHasSaved] = useState(false); // State variable to indicate if the output has been saved.
    const [loadingModal, setLoadingModal] = useState(false); // State variable to indicate loading state of the modal.
    const [isCommandAvailable, setIsCommandAvailable] = useState(false); // State variable to check if the command is available.
    const [opened, setOpened] = useState(!isCommandAvailable); // State variable that indicates if the modal is opened.

    // Form Hook to handle form input.
    let form = useForm({
        initialValues: {
            hostIP: "",
            shodanKey: "",
        },
    });

    useEffect(() => {
        // Check if the command is available and set the state variables accordingly.
        checkAllCommandsAvailability(dependencies)
          .then((isAvailable) => {
            // Set the command availability state.
            setIsCommandAvailable(isAvailable); 
            // Set the modal state to opened if the command is not available.
            setOpened(!isAvailable); 
            // Set loading to false after the check is done.
            setLoadingModal(false); // Ensure this is set to false even if successful
          })
          .catch((error) => {
            console.error("An error occurred:", error);
            // Also set loading to false in case of error.
            setLoadingModal(false); // Crucial change, set to false even on errors
          });
      }, []);

      
     /**
     * handleProcessData: Callback to handle and append new data from the child process to the output.
     * It updates the state by appending the new data received to the existing output.
     * @param {string} data - The data received from the child process.
     */
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);

    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);

            // Allow Saving as the output is finalised
            setAllowSave(true);
            setHasSaved(false);
        },
        [handleProcessData]
    );

    // Sends a SIGTERM signal to gracefully terminate the process
    const handleCancel = () => {
        if (pid !== null) {
            const args = [`-15`, pid];
            CommandHelper.runCommand("kill", args);
        }
    };

    // Actions taken after saving the output
    const handleSaveComplete = () => {
        // Indicating that the file has saved which is passed
        // back into SaveOutputToTextFile to inform the user
        setHasSaved(true);
        setAllowSave(false);
    };

    const onSubmit = async (values: FormValuesType) => {
        // Disallow saving until the tool's execution is complete
        setAllowSave(false);

        // Enable the loading overlay while the tool executes
        setLoading(true);

        const args = ["/usr/share/ddt/shodkey.py", "-i", values.hostIP, "-k", values.shodanKey];

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "python3",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput("");

        // reset save state variables to defaults
        setHasSaved(false);
        setAllowSave(false);
    }, [setOutput]);

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
            <LoadingOverlay visible={loading} />
            {loading && (
                <div>
                    <Button variant="outline" color="red" style={{ zIndex: 1001 }} onClick={handleCancel}>
                        Cancel
                    </Button>
                </div>
            )}
            <Stack>
                {UserGuide(title, description_userguide)}
                <TextInput label={"Valid API Key"} required {...form.getInputProps("shodanKey")} />
                <TextInput label={"Host IP"} required {...form.getInputProps("hostIP")} />
                <Button type={"submit"}>Scan</Button>
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
}
