import { Button, LoadingOverlay, Stack, TextInput, Title, Checkbox, Switch, Slider } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState, useEffect } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { UserGuide } from "../UserGuide/UserGuide";
import { SaveOutputToTextFile } from "../SaveOutputToFile/SaveOutputToTextFile";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import { checkAllCommandsAvailability } from "../../utils/CommandAvailability";
import InstallationModal from "../InstallationModal/InstallationModal";
import { RenderComponent } from "../UserGuide/UserGuide";

// Define the form values with their types
interface FormValuesType {
    input: string;
    outputDir: string;
    config: string;
    quiet: boolean;
    verbose: boolean;
    types: string;
    indirectBlockDetection: boolean;
    allHeaders: boolean;
    auditFileOnly: boolean;
    quickMode: boolean;
}

const Foremost = () => {
    // State hooks for loading, output, and advanced mode switch
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [checkedVerbose, setCheckedVerbose] = useState(false);
    const [checkedQuiet, setCheckedQuiet] = useState(false);
    const [checkedAdvanced, setCheckedAdvanced] = useState(false);
    const [pid, setPid] = useState("");
    const [isCommandAvailable, setIsCommandAvailable] = useState(false);
    const [opened, setOpened] = useState(!isCommandAvailable);
    const [loadingModal, setLoadingModal] = useState(true);

    const title = "Foremost"; 
    const description =
        "Foremost is a forensic program to recover lost files based on their headers, footers, and internal data structures.";
    const steps =
        "Step 1: Enter a valid file path to the subject file.\n" +
        "Step 2: Enter a valid file path to the output results.\n"
        "Step 3: Enter any additional options for the scan.\n" +
        "Step 4: Enter any additional parameters for the scan.\n" +
        "Step 5: Click Run Foremost to commence GoldenEye's operation.\n" +
        "Step 6: View the Output block below to view the results of the tool's execution."
    const sourceLink = "https://www.kali.org/tools/foremost/";
    const tutorial = ""; 
    const dependencies = ["foremost"]; 

    useEffect(() => {
        checkAllCommandsAvailability(dependencies)
            .then((isAvailable) => {
                setIsCommandAvailable(isAvailable);
                setOpened(!isAvailable);
                setLoadingModal(false); // Set loading to false after the check is done
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                setLoadingModal(false); // Also set loading to false in case of error
            });
    }, []);

    // Create a form using Mantine's useForm hook
    let form = useForm<FormValuesType>({
        initialValues: {
            input: "",
            outputDir: "",
            config: "",
            quiet: false,
            verbose: false,
            types: "",
            indirectBlockDetection: false,
            allHeaders: false,
            auditFileOnly: false,
            quickMode: false,
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
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
        },
        [handleProcessData]
    );

    // Handle form submission
    const onSubmit = async (values: FormValuesType) => {
        setLoading(true);
        // Initialize the command arguments with the input and output options
        const args = [`-i`, `${values.input}`, `-o`, `${values.outputDir}`];

        // Add optional flags based on user selections
        if (values.config) {
            args.push(`-c`, `${values.config}`);
        }

        //specify file type
        if (values.types) {
            args.push(`-t`, `${values.types}`);
        }

        //Advanced Mode
        if (checkedAdvanced) {
            //Run the command in quiet mode
            if (checkedQuiet) {
                args.push(`-Q`);
            }

            //Run the command in verbose mode
            if (checkedVerbose) {
                args.push(`-v`);
            }

            //Enable indirect block detection
            if (values.indirectBlockDetection) {
                args.push(`-d`);
            }

            //Write all headers option
            if (values.allHeaders) {
                args.push(`-a`);
            }

            //Only write audit files
            if (values.auditFileOnly) {
                args.push(`-w`);
            }
            //Enable Quick Mode
            if (values.quickMode) {
                args.push(`-q`);
            }
        }

        try {
            // Execute the Foremost command and update the output state
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "foremost",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setOutput(result.output);
            setPid(result.pid);
        } catch (e: any) {
            // In case of an error, update the output state with the error message
            setOutput(e.message);
        }
    };

    // Clear the output state
    const clearOutput = useCallback(() => {
        setOutput("");
    }, [setOutput]);

    // Render the GUI
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
                ></InstallationModal>
            )}
            <form onSubmit={form.onSubmit(onSubmit)}>
                {LoadingOverlayAndCancelButton(loading, pid)}
                <Stack spacing="lg">
                    {/* Advanced Mode Switch */}
                    <Switch
                        label="Advanced Mode"
                        checked={checkedAdvanced}
                        onChange={(e) => setCheckedAdvanced(e.currentTarget.checked)}
                    />
                    {/* Input File/Device */}
                    <TextInput
                        label={"Input File/Device"}
                        placeholder={"eg. /path/to/myfile/file.dd"}
                        required
                        {...form.getInputProps("input")}
                    />
                    {/* Output Directory */}
                    <TextInput
                        label={"Output Directory"}
                        placeholder={"eg. path/to/output/folder"}
                        required
                        {...form.getInputProps("outputDir")}
                    />
                    {/* File Types */}
                    <TextInput
                        label={"File Types"}
                        placeholder={"Specify types (comma-separated) e.g., jpg,doc. if blank will retrieve all."}
                        {...form.getInputProps("types")}
                    />
                    <Stack spacing="lg"></Stack>

                    {/* Advanced Options */}
                    {checkedAdvanced && (
                        <Stack spacing="lg">
                            {!checkedVerbose && (
                                <Switch
                                    label="Quiet Mode"
                                    checked={checkedQuiet}
                                    onChange={(e) => setCheckedQuiet(e.currentTarget.checked)}
                                />
                            )}
                            {!checkedQuiet && (
                                <Switch
                                    label="Verbose Mode"
                                    checked={checkedVerbose}
                                    onChange={(e) => setCheckedVerbose(e.currentTarget.checked)}
                                />
                            )}
                            {/* Configuration File */}
                            <TextInput
                                label={"Configuration File"}
                                placeholder={"set configuration file to use (defaults to foremost.conf)"}
                                {...form.getInputProps("config")}
                            />
                            {/* Indirect Block Detection */}
                            <Checkbox
                                label={
                                    "Indirect Block Detection - turn on indirect block detection (for UNIX file-systems)."
                                }
                                {...form.getInputProps("indirectBlockDetection" as keyof FormValuesType)}
                            />
                            {/* Write All Headers */}
                            <Checkbox
                                label={
                                    "Write All Headers - write all headers, perform no error detection (corrupted files)."
                                }
                                {...form.getInputProps("allHeaders" as keyof FormValuesType)}
                            />
                            {/* Audit File Only */}
                            <Checkbox
                                label={
                                    "Audit File Only - only write the audit file, do not write any detected files to the disk."
                                }
                                {...form.getInputProps("auditFileOnly" as keyof FormValuesType)}
                            />
                            {/* Quick Mode */}
                            <Checkbox
                                label={
                                    "Quick Mode - enables quick mode. Searches are performed on 512 byte boundaries."
                                }
                                {...form.getInputProps("quickMode" as keyof FormValuesType)}
                            />
                        </Stack>
                    )}
                    {/* Submit Button */}
                    <Button type={"submit"}>Run Foremost</Button>
                    {/* Saving the output to a text file if requested */}
                    {SaveOutputToTextFile(output)}
                    {/* Console Output */}
                    <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
                </Stack>
            </form>
        </RenderComponent>
    );
};

export default Foremost;
