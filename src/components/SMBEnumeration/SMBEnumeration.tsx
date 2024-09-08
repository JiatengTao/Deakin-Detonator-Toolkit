import { Button, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import InstallationModal from "../InstallationModal/InstallationModal";

const title = "SMB Enumeration";

// Description for the tooltip. Contents of this variable are displayed to the user when
// hovering over the info option.
const description_userguide =
    "SMB (Server Message Block) represents a network protocol widely used to " +
    "provide shared access across files, printers, and serial ports within a network. " +
    "This tool aims to enumerate an SMB server to find potential vulnerabilities. \n\n" +
    "How to use SMB Enumeration:\n\n" +
    "Step 1: Enter an IP address or hostname.\n" +
    "       E.g. 127.0.0.1\n\n" +
    "Step 2: Enter a port number.\n" +
    "       E.g. 445\n\n" +
    "Step 3: Pick a scan speed. Note - higher speeds require a faster host network.\n" +
    "T0 - Paranoid / T1 - Sneaky / T2 - Polite / T3 - Normal / T4 - Aggressive / T5 - Insane\n" +
    "       E.g. T3\n\n" +
    "Step 4: Select an SMB enumeration script to run against the target.\n" +
    "       E.g smb-flood.nse\n\n" +
    "Step 5: Click Start SMB Enumeration to commence the SMB enumeration operation.\n\n" +
    "Step 6: View the output block below to view the results of the scan.";

// Represents the form values for the SMBEnumeration component.
interface FormValuesType {
    ip: string; // The IP address or hostname.
    port: string; // The port number.
    speed: string; // The scan speed.
    scripts: string; // The selected SMB enumeration script.
}

const speeds = ["T0", "T1", "T2", "T3", "T4", "T5"]; // The scan speeds.

// The list of SMB enumeration scripts.
const scripts = [
    "smb2-capabilities.nse",
    "smb2-security-mode.nse",
    "smb2-time.nse",
    "smb2-vuln-uptime.nse",
    "smb-brute.nse",
    "smb-double-pulsar-backdoor.nse",
    "smb-enum-domains.nse",
    "smb-enum-groups.nse",
    "smb-enum-processes.nse",
    "smb-enum-services.nse",
    "smb-enum-sessions.nse",
    "smb-enum-shares.nse",
    "smb-enum-users.nse",
    "smb-flood.nse",
    "smb-ls.nse",
    "smb-mbenum.nse",
    "smb-os-discovery.nse",
    "smb-print-text.nse",
    "smb-protocols.nse",
    "smb-psexec.nse",
    "smb-security-mode.nse",
    "smb-server-stats.nse",
    "smb-system-info.nse",
    "smb-vuln-conficker.nse",
    "smb-vuln-cve2009-3103.nse",
    "smb-vuln-cve-2017-7494.nse",
    "smb-vuln-ms06-025.nse",
    "smb-vuln-ms07-029.nse",
    "smb-vuln-ms08-067.nse",
    "smb-vuln-ms10-054.nse",
    "smb-vuln-ms10-061.nse",
    "smb-vuln-ms17-010.nse",
    "smb-vuln-regsvc-dos.nse",
    "smb-vuln-webexec.nse",
    "smb-webexec-exploit.nse",
];

const SMBEnumeration = () => {
    const [loading, setLoading] = useState(false); // Represents the loading state of the component.
    const [output, setOutput] = useState(""); // Maintain the state (output) of the component.
    const [allowSave, setAllowSave] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [selectedSpeedOption, setSelectedSpeedOption] = useState("T3"); // Default value for scan speed
    const [selectedScriptOption, setSelectedScriptOption] = useState("smb-enum-users"); // Default value for script
    const [pid, setPid] = useState(""); // Maintain the state of the process id.
    const [opened, setOpened] = useState(false); // Modal state

    // useForm is a hook that provides a state object and a set of functions to handle form data.
    // The state object contains the current value of the form, and the set of functions contains
    // the methods to update the state object.
    let form = useForm({
        initialValues: {
            ip: "",
            port: "",
            speed: "T3",
            scripts: "smb-enum-users",
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    const handleProcessData = useCallback(
        (data: string) => {
            setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
            if (!allowSave) setAllowSave(true);
        },
        [allowSave]
    );

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
            setAllowSave(true);
        },
        [handleProcessData]
    );

    // onSubmit is a function that is called when the form is submitted.
    const onSubmit = async (values: FormValuesType) => {
        // Set the loading state to true. This will display the loading overlay.
        setLoading(true);
        setAllowSave(false);
        setHasSaved(false);

        // Check if the values.speed is not empty. If it is empty set it to T3.
        // This is the default value for the speed of the scan.
        if (!values.speed) {
            values.speed = "T3"; // Default value for scan speed
        }

        const args = [`-${values.speed}`, `--script=${values.scripts}`]; // Prepare the arguments for the console.

        // If the port value is set, add it to the arguments.
        if (values.port) {
            args.push(`-p ${values.port}`);
        }

        // Add the IP address to the arguments.
        args.push(values.ip);

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "nmap",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message || "An error occurred.");
        }
    };

    // Clears the output by setting it to an empty string.
    const clearOutput = useCallback(() => {
        setOutput("");
        setAllowSave(false);
        setHasSaved(false);
    }, []);

    const handleSaveComplete = useCallback(() => {
        setHasSaved(true);
        setAllowSave(false);
    }, []);

    return (
        <form
            onSubmit={form.onSubmit((values) =>
                onSubmit({ ...values, speed: selectedSpeedOption, scripts: selectedScriptOption })
            )}
        >
            {LoadingOverlayAndCancelButton(loading, pid)}
            {InstallationModal && (
                <InstallationModal
                    isOpen={opened}
                    setOpened={setOpened}
                    feature_description={description_userguide}
                    dependencies={[]} // Add dependencies if needed
                />
            )}
            <Stack>
                {/* Render the user guide description */}
                <TextInput label={"Target IP or Hostname"} required {...form.getInputProps("ip")} />
                <TextInput label={"Port"} required {...form.getInputProps("port")} placeholder={"Example: 445"} />

                {/* Scan Speed dropdown */}
                <NativeSelect
                    label={"Scan speed"}
                    value={selectedSpeedOption}
                    onChange={(e) => setSelectedSpeedOption(e.target.value)}
                    title={"Scan speed"}
                    data={speeds}
                    placeholder={"Select a scan speed. Default set to T3"}
                    description={"Speed of the scan, refer: https://nmap.org/book/performance-timing-templates.html"}
                />

                {/* SMB Script dropdown */}
                <NativeSelect
                    label={"SMB Enumeration Script"}
                    value={selectedScriptOption}
                    onChange={(e) => setSelectedScriptOption(e.target.value)}
                    title={"SMB Enumeration Script"}
                    data={scripts}
                    placeholder={"Select an SMB Enumeration Script to run against the target"}
                    description={"NSE Scripts, refer: https://nmap.org/nsedoc/scripts/"}
                />

                {/* Submit button */}
                <Button type={"submit"}>Scan</Button>

                {/* Save Output to Text File component */}
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}

                {/* ConsoleWrapper to display the command output */}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
};

export default SMBEnumeration;
