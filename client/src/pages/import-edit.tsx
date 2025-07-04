import ImportNewEnhancedPage from "./import-new-enhanced";

export default function ImportEditPage() {
  // Use the same enhanced form component that's used for creation
  return <ImportNewEnhancedPage isEditing={true} />;
}