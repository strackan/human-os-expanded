#!/bin/bash

###############################################################################
# Workflow JSON Validation Script
#
# Validates extracted workflow JSON files to ensure:
# - Valid JSON syntax
# - Required fields present
# - UI artifacts excluded (as designed)
# - Notifications present
# - Template syntax valid
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
print_test_header() {
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

###############################################################################
# Validation Functions
###############################################################################

validate_json_syntax() {
    local file=$1
    print_test_header "Test 1: JSON Syntax Validation - $(basename "$file")"

    if jq empty "$file" 2>/dev/null; then
        print_success "Valid JSON syntax"
        return 0
    else
        print_failure "Invalid JSON syntax"
        return 1
    fi
}

validate_required_fields() {
    local file=$1
    print_test_header "Test 2: Required Fields - $(basename "$file")"

    local required_fields=("id" "name" "description" "version" "trigger" "context" "steps")
    local all_present=true

    for field in "${required_fields[@]}"; do
        if jq -e ".$field" "$file" > /dev/null 2>&1; then
            print_success "Field '$field' present"
        else
            print_failure "Field '$field' missing"
            all_present=false
        fi
    done

    [ "$all_present" = true ]
}

validate_no_ui_artifacts() {
    local file=$1
    print_test_header "Test 3: UI Artifacts Excluded - $(basename "$file")"

    # Check that ui.artifacts is not present in any step
    if jq -e '.steps[].ui.artifacts' "$file" > /dev/null 2>&1; then
        print_failure "UI artifacts found (should be excluded)"
        print_info "Found: $(jq -r '[.steps[] | select(.ui.artifacts) | .id] | join(", ")' "$file")"
        return 1
    else
        print_success "No UI artifacts found (correctly excluded)"
        return 0
    fi
}

validate_no_ui_actions() {
    local file=$1
    print_test_header "Test 4: UI Actions Excluded - $(basename "$file")"

    # Check that ui.actions is not present in any step
    if jq -e '.steps[].ui.actions' "$file" > /dev/null 2>&1; then
        print_failure "UI actions found (should be excluded)"
        print_info "Found: $(jq -r '[.steps[] | select(.ui.actions) | .id] | join(", ")' "$file")"
        return 1
    else
        print_success "No UI actions found (correctly excluded)"
        return 0
    fi
}

validate_has_notifications() {
    local file=$1
    print_test_header "Test 5: Notifications Present - $(basename "$file")"

    # Count total notifications across all steps
    local notification_count=$(jq '[.steps[].notifications // []] | add | length' "$file" 2>/dev/null)

    if [ "$notification_count" -gt 0 ]; then
        print_success "Found $notification_count notifications"

        # Show notification breakdown by step
        jq -r '.steps[] | select(.notifications) | "  Step: \(.id) - \(.notifications | length) notifications"' "$file" | while read -r line; do
            print_info "$line"
        done
        return 0
    else
        print_failure "No notifications found"
        return 1
    fi
}

validate_template_syntax() {
    local file=$1
    print_test_header "Test 6: Handlebars Template Syntax - $(basename "$file")"

    # Extract all template strings and check for matching braces
    local templates=$(jq -r '.. | strings | select(contains("{{"))' "$file" 2>/dev/null)
    local syntax_valid=true
    local template_count=0

    while IFS= read -r template; do
        ((template_count++))

        # Count opening and closing braces
        local opening=$(echo "$template" | grep -o "{{" | wc -l)
        local closing=$(echo "$template" | grep -o "}}" | wc -l)

        if [ "$opening" -ne "$closing" ]; then
            print_failure "Mismatched template braces: $template"
            syntax_valid=false
        fi
    done <<< "$templates"

    if [ "$syntax_valid" = true ]; then
        print_success "All $template_count templates have matching braces"
        return 0
    else
        return 1
    fi
}

validate_workflow_structure() {
    local file=$1
    print_test_header "Test 7: Workflow Structure - $(basename "$file")"

    # Check that each step has required fields
    local step_count=$(jq '.steps | length' "$file" 2>/dev/null)
    print_info "Found $step_count steps"

    local all_steps_valid=true

    for i in $(seq 0 $((step_count - 1))); do
        local step_id=$(jq -r ".steps[$i].id" "$file" 2>/dev/null)
        local step_name=$(jq -r ".steps[$i].name" "$file" 2>/dev/null)
        local step_type=$(jq -r ".steps[$i].type" "$file" 2>/dev/null)

        if [ -z "$step_id" ] || [ "$step_id" = "null" ]; then
            print_failure "Step $i missing 'id'"
            all_steps_valid=false
        elif [ -z "$step_name" ] || [ "$step_name" = "null" ]; then
            print_failure "Step $i ($step_id) missing 'name'"
            all_steps_valid=false
        else
            print_success "Step: $step_id ($step_name)"
        fi
    done

    [ "$all_steps_valid" = true ]
}

validate_notification_structure() {
    local file=$1
    print_test_header "Test 8: Notification Structure - $(basename "$file")"

    # Check that each notification has required fields
    local all_valid=true

    jq -c '.steps[] | select(.notifications) | .id as $step_id | .notifications[] | {step: $step_id, notification: .}' "$file" 2>/dev/null | while read -r notification; do
        local step_id=$(echo "$notification" | jq -r '.step')
        local has_type=$(echo "$notification" | jq -e '.notification.type' > /dev/null 2>&1 && echo "yes" || echo "no")
        local has_title=$(echo "$notification" | jq -e '.notification.title' > /dev/null 2>&1 && echo "yes" || echo "no")
        local has_recipients=$(echo "$notification" | jq -e '.notification.recipients' > /dev/null 2>&1 && echo "yes" || echo "no")

        if [ "$has_type" = "yes" ] && [ "$has_title" = "yes" ] && [ "$has_recipients" = "yes" ]; then
            local notif_type=$(echo "$notification" | jq -r '.notification.type')
            print_success "Step $step_id: notification type '$notif_type' has required fields"
        else
            print_failure "Step $step_id: notification missing required fields (type, title, or recipients)"
            all_valid=false
        fi
    done

    [ "$all_valid" = true ]
}

###############################################################################
# Main Execution
###############################################################################

main() {
    local workflows_dir="$1"

    if [ -z "$workflows_dir" ]; then
        workflows_dir="$(dirname "$0")/../database/seeds/workflows"
    fi

    print_test_header "Workflow JSON Validation Suite"
    print_info "Validating workflows in: $workflows_dir"

    # Find all JSON files
    local workflow_files=($(find "$workflows_dir" -name "*.json" -type f | sort))

    if [ ${#workflow_files[@]} -eq 0 ]; then
        echo -e "${RED}No workflow JSON files found in $workflows_dir${NC}"
        exit 1
    fi

    print_info "Found ${#workflow_files[@]} workflow files"
    echo ""

    # Validate each workflow
    for workflow_file in "${workflow_files[@]}"; do
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}Validating: $(basename "$workflow_file")${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

        validate_json_syntax "$workflow_file"
        validate_required_fields "$workflow_file"
        validate_no_ui_artifacts "$workflow_file"
        validate_no_ui_actions "$workflow_file"
        validate_has_notifications "$workflow_file"
        validate_template_syntax "$workflow_file"
        validate_workflow_structure "$workflow_file"
        validate_notification_structure "$workflow_file"
    done

    # Summary
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}VALIDATION SUMMARY${NC}"
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "Total tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ All validations passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some validations failed${NC}"
        exit 1
    fi
}

# Run main with optional directory argument
main "$@"
