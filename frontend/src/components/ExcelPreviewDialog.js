import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Info as InfoIcon,
  AutoFixHigh as AutoFixIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ExcelPreviewDialog = ({ 
  open, 
  onClose, 
  file, 
  brands = [], 
  categoryId,
  onUploadConfirm,
  uploading = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [validationResults, setValidationResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [duplicateModelNumbers, setDuplicateModelNumbers] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [editValidation, setEditValidation] = useState({ type: 'default', message: '' });
  const [validatingEdit, setValidatingEdit] = useState(false);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [workbookData, setWorkbookData] = useState(null);
  const [processAllSheets, setProcessAllSheets] = useState(false);
  const [combinedData, setCombinedData] = useState([]);
  const [sheetsData, setSheetsData] = useState({});

  // Column definitions for product data
  const expectedColumns = [
    { key: 'modelNumber', label: 'Model Number', required: true, type: 'text' },
    { key: 'brand', label: 'Brand', required: true, type: 'select', options: brands },
    { key: 'hp', label: 'HP', required: false, type: 'number' },
    { key: 'outlet', label: 'Outlet', required: false, type: 'text' },
    { key: 'maxHead', label: 'Max Head (m)', required: false, type: 'number' },
    { key: 'maxFlow', label: 'Max Flow (l/min)', required: false, type: 'number' },
    { key: 'watt', label: 'Watt', required: false, type: 'number' },
    { key: 'phase', label: 'Phase', required: false, type: 'text' },
    { key: 'price', label: 'Price (LKR)', required: false, type: 'number' },
  ];

  useEffect(() => {
    if (file && open) {
      parseExcelFile();
    }
  }, [file, open]);

  useEffect(() => {
    if (previewData.length > 0) {
      validateData();
      checkDuplicateModelNumbers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, brands]);

  useEffect(() => {
    if (duplicateModelNumbers.length > 0) {
      validateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateModelNumbers]);

  // Debounced validation for edit values
  useEffect(() => {
    if (editingCell && editValue !== '') {
      const [rowIndex, columnKey] = editingCell.split('-');
      const timeoutId = setTimeout(() => {
        validateEditValue(editValue, columnKey, Number.parseInt(rowIndex, 10));
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setEditValidation({ type: 'default', message: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editValue, editingCell]);

  const parseExcelFile = async (sheetName = null, processAll = false) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Store workbook data for sheet switching
      setWorkbookData(workbook);
      
      // Get all available sheets
      const sheetNames = workbook.SheetNames;
      const sheetsInfo = sheetNames.map((name, index) => ({
        name,
        index,
        displayName: name || `Sheet ${index + 1}`
      }));
      setAvailableSheets(sheetsInfo);
      
      if (processAll || processAllSheets) {
        // Process all sheets and combine data
        await processAllSheetsData(workbook, sheetsInfo);
        return;
      }
      
      // Use selected sheet or first sheet as default
      const targetSheetName = sheetName || selectedSheet || sheetNames[0];
      if (!selectedSheet && !sheetName) {
        setSelectedSheet(targetSheetName);
      }
      
      const worksheet = workbook.Sheets[targetSheetName];
      
      if (!worksheet) {
        setErrors([{ message: `Sheet '${targetSheetName}' not found in Excel file`, row: 0, type: 'error' }]);
        setPreviewData([]);
        return;
      }
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' 
      });

      if (jsonData.length === 0) {
        setErrors([{ message: 'Excel file is empty', row: 0, type: 'error' }]);
        setPreviewData([]);
        return;
      }

      // Process data
      const headers = jsonData[0] || [];
      const rows = jsonData.slice(1);

      // Map headers to expected columns
      const columnMapping = mapHeaders(headers);
      
      // Convert rows to objects
      const processedData = rows.map((row, index) => {
        const rowData = { 
          _originalRow: index + 2, // +2 because we skip header and arrays are 0-indexed
          _errors: []
        };
        
        headers.forEach((header, colIndex) => {
          const mappedKey = columnMapping[header] || header.toLowerCase().replace(/\s+/g, '');
          rowData[mappedKey] = row[colIndex] || '';
        });

        return rowData;
      }).filter(row => {
        // Filter out completely empty rows
        return Object.keys(row).some(key => 
          !key.startsWith('_') && row[key] && row[key].toString().trim() !== ''
        );
      });

      setPreviewData(processedData);
    } catch (error) {
      setErrors([{ 
        message: `Failed to parse Excel file: ${error.message}`, 
        row: 0, 
        type: 'error' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const mapHeaders = (headers) => {
    const mapping = {};
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Map common header variations to our expected columns
      if (normalized.includes('model') || normalized.includes('number')) {
        mapping[header] = 'modelNumber';
      } else if (normalized.includes('brand')) {
        mapping[header] = 'brand';
      } else if (normalized === 'hp' || normalized.includes('horsepower')) {
        mapping[header] = 'hp';
      } else if (normalized.includes('outlet')) {
        mapping[header] = 'outlet';
      } else if (normalized.includes('head') || normalized.includes('maxhead')) {
        mapping[header] = 'maxHead';
      } else if (normalized.includes('flow') || normalized.includes('maxflow')) {
        mapping[header] = 'maxFlow';
      } else if (normalized.includes('watt') || normalized.includes('power')) {
        mapping[header] = 'watt';
      } else if (normalized.includes('phase')) {
        mapping[header] = 'phase';
      } else if (normalized.includes('price') || normalized.includes('cost')) {
        mapping[header] = 'price';
      }
    });
    
    return mapping;
  };

  const checkDuplicateModelNumbers = async () => {
    if (!previewData.length) return;
    
    setCheckingDuplicates(true);
    try {
      const modelNumbers = previewData
        .map(row => row.modelNumber)
        .filter(model => model && model.toString().trim());
      
      if (modelNumbers.length === 0) {
        setCheckingDuplicates(false);
        return;
      }
      
      const response = await axios.post('/api/products/check-duplicates', {
        modelNumbers,
        categoryId
      });
      
      setDuplicateModelNumbers(response.data.duplicates || []);
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // If API fails, continue without duplicate checking
      setDuplicateModelNumbers([]);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const validateData = () => {
    const newErrors = [];
    const validationResults = {};

    previewData.forEach((row, index) => {
      const rowErrors = [];
      
      expectedColumns.forEach(column => {
        const value = row[column.key];
        const cellKey = `${index}-${column.key}`;
        
        // Required field validation
        if (column.required && (!value || value.toString().trim() === '')) {
          rowErrors.push({
            field: column.key,
            message: `${column.label} is required`,
            type: 'error'
          });
          validationResults[cellKey] = { type: 'error', message: `${column.label} is required` };
        }
        
        // Type validation
        if (value && value.toString().trim() !== '') {
          if (column.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
              rowErrors.push({
                field: column.key,
                message: `${column.label} must be a positive number`,
                type: 'error'
              });
              validationResults[cellKey] = { type: 'error', message: 'Invalid number' };
            } else {
              validationResults[cellKey] = { type: 'success' };
            }
          }
          
          // Brand validation
          if (column.key === 'brand' && column.options.length > 0) {
            const brandExists = column.options.some(brand => 
              brand.name.toLowerCase() === value.toString().toLowerCase()
            );
            if (!brandExists) {
              rowErrors.push({
                field: column.key,
                message: `Brand "${value}" not found in system`,
                type: 'warning',
                suggestion: `Available brands: ${column.options.slice(0, 3).map(b => b.name).join(', ')}${column.options.length > 3 ? '...' : ''}`
              });
              validationResults[cellKey] = { type: 'warning', message: 'Brand not found', suggestion: 'Click to select from available brands' };
            } else {
              validationResults[cellKey] = { type: 'success' };
            }
          }
          
          // Model number duplicate validation
          if (column.key === 'modelNumber' && value) {
            const isDuplicate = duplicateModelNumbers.includes(value.toString().trim());
            if (isDuplicate) {
              rowErrors.push({
                field: column.key,
                message: `Model number "${value}" already exists in the system`,
                type: 'info',
                suggestion: 'This will update the existing product instead of creating a new one'
              });
              validationResults[cellKey] = { type: 'info', message: 'Will update existing product' };
            }
          }
        }
      });

      if (rowErrors.length > 0) {
        newErrors.push({
          row: row._originalRow,
          errors: rowErrors,
          type: rowErrors.some(e => e.type === 'error') ? 'error' : 'warning'
        });
      }
    });

    setErrors(newErrors);
    setValidationResults(validationResults);
  };

  const handleCellEdit = (rowIndex, columnKey, currentValue) => {
    setEditingCell(`${rowIndex}-${columnKey}`);
    setEditValue(currentValue || '');
    setEditValidation({ type: 'default', message: '' });
    setValidatingEdit(false);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    
    // Don't save if there's a validation error
    if (editValidation.type === 'error') {
      alert('Please fix the validation error before saving.');
      return;
    }
    
    const [rowIndex, columnKey] = editingCell.split('-');
    const newData = [...previewData];
    newData[Number.parseInt(rowIndex, 10)][columnKey] = editValue;
    
    setPreviewData(newData);
    setEditingCell(null);
    setEditValue('');
    setEditValidation({ type: 'default', message: '' });
    setValidatingEdit(false);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setEditValidation({ type: 'default', message: '' });
    setValidatingEdit(false);
  };

  const handleSheetChange = async (newSheetName) => {
    setSelectedSheet(newSheetName);
    setEditingCell(null);
    setEditValue('');
    setEditValidation({ type: 'default', message: '' });
    
    if (workbookData) {
      await parseExcelFile(newSheetName);
    }
  };

  const processAllSheetsData = async (workbook, sheetsInfo) => {
    const allSheetsData = {};
    const combinedRows = [];
    let totalRowsProcessed = 0;
    
    for (const sheetInfo of sheetsInfo) {
      const worksheet = workbook.Sheets[sheetInfo.name];
      
      if (!worksheet) continue;
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' 
      });

      if (jsonData.length === 0) continue;

      // Process data for this sheet
      const headers = jsonData[0] || [];
      const rows = jsonData.slice(1);

      // Map headers to expected columns
      const columnMapping = mapHeaders(headers);
      
      // Convert rows to objects with sheet source
      const processedData = rows.map((row, index) => {
        const rowData = { 
          _originalRow: index + 2, // +2 because we skip header and arrays are 0-indexed
          _sourceSheet: sheetInfo.name,
          _sheetDisplayName: sheetInfo.displayName,
          _globalRowIndex: totalRowsProcessed + index + 1,
          _errors: []
        };
        
        headers.forEach((header, colIndex) => {
          const mappedKey = columnMapping[header] || header.toLowerCase().replace(/\s+/g, '');
          rowData[mappedKey] = row[colIndex] || '';
        });

        return rowData;
      }).filter(row => {
        // Filter out completely empty rows
        return Object.keys(row).some(key => 
          !key.startsWith('_') && row[key] && row[key].toString().trim() !== ''
        );
      });

      allSheetsData[sheetInfo.name] = {
        sheetInfo,
        data: processedData,
        headers,
        rowCount: processedData.length
      };
      
      combinedRows.push(...processedData);
      totalRowsProcessed += processedData.length;
    }
    
    setSheetsData(allSheetsData);
    setCombinedData(combinedRows);
    setPreviewData(combinedRows);
    setProcessAllSheets(true);
    setSelectedSheet('ALL_SHEETS');
  };

  const toggleAllSheetsMode = async () => {
    if (processAllSheets) {
      // Switch back to single sheet mode
      setProcessAllSheets(false);
      setCombinedData([]);
      setSheetsData({});
      if (workbookData && availableSheets.length > 0) {
        await parseExcelFile(availableSheets[0].name);
      }
    } else {
      // Switch to all sheets mode
      if (workbookData) {
        await processAllSheetsData(workbookData, availableSheets);
      }
    }
  };

  const validateEditValue = async (value, columnKey, rowIndex) => {
    if (!value || !value.toString().trim()) {
      const column = expectedColumns.find(c => c.key === columnKey);
      if (column?.required) {
        setEditValidation({ type: 'error', message: `${column.label} is required` });
        return;
      }
      setEditValidation({ type: 'default', message: '' });
      return;
    }

    const column = expectedColumns.find(c => c.key === columnKey);
    if (!column) {
      setEditValidation({ type: 'default', message: '' });
      return;
    }

    // Type validation
    if (column.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setEditValidation({ type: 'error', message: `${column.label} must be a positive number` });
        return;
      }
    }

    // Brand validation
    if (column.key === 'brand' && column.options?.length > 0) {
      const brandExists = column.options.some(brand => 
        brand.name.toLowerCase() === value.toString().toLowerCase()
      );
      if (!brandExists) {
        const suggestions = column.options
          .filter(brand => brand.name.toLowerCase().includes(value.toString().toLowerCase()))
          .slice(0, 3)
          .map(b => b.name);
        
        setEditValidation({ 
          type: 'warning', 
          message: `Brand "${value}" not found`,
          suggestions: suggestions.length > 0 ? `Similar: ${suggestions.join(', ')}` : undefined
        });
        return;
      }
    }

    // Model number validation with real-time duplicate checking
    if (column.key === 'modelNumber') {
      setValidatingEdit(true);
      try {
        const response = await axios.post('/api/products/check-duplicates', {
          modelNumbers: [value.toString().trim()],
          categoryId
        });
        
        if (response.data.duplicates.length > 0) {
          setEditValidation({ 
            type: 'info', 
            message: `Model "${value}" exists - will update existing product` 
          });
        } else {
          setEditValidation({ type: 'success', message: `Model "${value}" is available` });
        }
      } catch (error) {
        console.error('Error validating model number:', error);
        setEditValidation({ type: 'default', message: '' });
      } finally {
        setValidatingEdit(false);
      }
      return;
    }

    // If we get here, validation passed
    setEditValidation({ type: 'success', message: 'Valid' });
  };

  const handleBulkCorrection = (correctionType) => {
    const newData = [...previewData];
    let changesCount = 0;
    
    switch (correctionType) {
      case 'fix-empty-required':
        newData.forEach((row, rowIndex) => {
          expectedColumns.forEach(column => {
            if (column.required && (!row[column.key] || row[column.key].toString().trim() === '')) {
              if (column.key === 'modelNumber' && !row[column.key]) {
                row[column.key] = `AUTO-${Date.now()}-${rowIndex}`;
                changesCount++;
              }
            }
          });
        });
        break;
      
      case 'suggest-brands':
        newData.forEach((row) => {
          if (row.brand && brands.length > 0) {
            const currentBrand = row.brand.toString().toLowerCase();
            const exactMatch = brands.find(b => b.name.toLowerCase() === currentBrand);
            
            if (!exactMatch) {
              // Find closest match
              const closeMatch = brands.find(b => 
                b.name.toLowerCase().includes(currentBrand) || 
                currentBrand.includes(b.name.toLowerCase())
              );
              
              if (closeMatch) {
                row.brand = closeMatch.name;
                changesCount++;
              }
            }
          }
        });
        break;
        
      case 'format-numbers':
        newData.forEach((row) => {
          expectedColumns.forEach(column => {
            if (column.type === 'number' && row[column.key]) {
              const stringValue = row[column.key].toString();
              const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
              
              if (!isNaN(numValue) && numValue >= 0 && stringValue !== numValue.toString()) {
                row[column.key] = numValue;
                changesCount++;
              }
            }
          });
        });
        break;
      
      default:
        break;
    }
    
    if (changesCount > 0) {
      setPreviewData(newData);
    }
    
    return changesCount;
  };

  const getCellValidation = (rowIndex, columnKey) => {
    return validationResults[`${rowIndex}-${columnKey}`] || { type: 'default' };
  };

  const renderCell = (row, rowIndex, column) => {
    const cellKey = `${rowIndex}-${column.key}`;
    const isEditing = editingCell === cellKey;
    const validation = getCellValidation(rowIndex, column.key);
    const value = row[column.key];

    if (isEditing) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {column.type === 'select' && column.options ? (
              <Box sx={{ width: '100%' }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    displayEmpty
                    error={editValidation.type === 'error'}
                  >
                    <MenuItem value="">Select {column.label}</MenuItem>
                    {column.options.map((option) => (
                      <MenuItem key={option._id} value={option.name}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Quick suggestions for brands */}
                {column.key === 'brand' && editValidation.type === 'warning' && editValue && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {column.options
                      .filter(brand => brand.name.toLowerCase().includes(editValue.toLowerCase()))
                      .slice(0, 3)
                      .map((brand, index) => (
                        <Chip
                          key={index}
                          label={brand.name}
                          size="small"
                          onClick={() => setEditValue(brand.name)}
                          sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
                          variant="outlined"
                          color="primary"
                        />
                      ))
                    }
                  </Box>
                )}
              </Box>
            ) : (
              <TextField
                size="small"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                type={column.type === 'number' ? 'number' : 'text'}
                fullWidth
                error={editValidation.type === 'error'}
                helperText={editValidation.message || ''}
                FormHelperTextProps={{
                  sx: {
                    color: editValidation.type === 'error' ? 'error.main' :
                           editValidation.type === 'warning' ? 'warning.main' :
                           editValidation.type === 'info' ? 'info.main' :
                           editValidation.type === 'success' ? 'success.main' : 'text.secondary'
                  }
                }}
              />
            )}
            <IconButton 
              size="small" 
              onClick={handleSaveEdit} 
              color="primary"
              disabled={editValidation.type === 'error' || validatingEdit}
            >
              {validatingEdit ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={handleCancelEdit}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Show validation feedback */}
          {editValidation.message && editValidation.type !== 'default' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {editValidation.type === 'error' && <ErrorIcon color="error" fontSize="small" />}
              {editValidation.type === 'warning' && <WarningIcon color="warning" fontSize="small" />}
              {editValidation.type === 'info' && <InfoIcon color="info" fontSize="small" />}
              {editValidation.type === 'success' && <CheckCircleIcon color="success" fontSize="small" />}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: editValidation.type === 'error' ? 'error.main' :
                         editValidation.type === 'warning' ? 'warning.main' :
                         editValidation.type === 'info' ? 'info.main' :
                         editValidation.type === 'success' ? 'success.main' : 'text.secondary'
                }}
              >
                {editValidation.message}
                {editValidation.suggestions && (
                  <span style={{ display: 'block', fontSize: '0.7rem' }}>
                    {editValidation.suggestions}
                  </span>
                )}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          backgroundColor: validation.type === 'error' ? 'error.50' : 
                          validation.type === 'warning' ? 'warning.50' : 
                          validation.type === 'info' ? 'info.50' :
                          validation.type === 'success' ? 'success.50' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
        onClick={() => handleCellEdit(rowIndex, column.key, value)}
      >
        <Typography variant="body2" sx={{ flex: 1 }}>
          {value || '-'}
        </Typography>
        
        {validation.type === 'error' && (
          <Tooltip title={validation.message}>
            <ErrorIcon color="error" fontSize="small" />
          </Tooltip>
        )}
        
        {validation.type === 'warning' && (
          <Tooltip title={`${validation.message}${validation.suggestion ? `\n${validation.suggestion}` : ''}`}>
            <WarningIcon color="warning" fontSize="small" />
          </Tooltip>
        )}
        
        {validation.type === 'info' && (
          <Tooltip title={`${validation.message}${validation.suggestion ? `\n${validation.suggestion}` : ''}`}>
            <InfoIcon color="info" fontSize="small" />
          </Tooltip>
        )}
        
        {validation.type === 'success' && (
          <CheckCircleIcon color="success" fontSize="small" />
        )}
        
        <EditIcon fontSize="small" sx={{ opacity: 0.5 }} />
      </Box>
    );
  };

  const handleConfirmUpload = () => {
    // Convert preview data to the format expected by the upload API
    const uploadData = previewData.map(row => {
      const cleanRow = { ...row };
      delete cleanRow._originalRow;
      delete cleanRow._errors;
      return cleanRow;
    });

    onUploadConfirm(uploadData);
  };

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  const infoCount = errors.filter(e => e.type === 'info').length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Excel Upload Preview</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary */}
            <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Upload Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={processAllSheets ? `${previewData.length} total rows from ${availableSheets.length} sheets` : `${previewData.length} rows`} 
                  color={processAllSheets ? "secondary" : "primary"} 
                />
                {processAllSheets && (
                  <Chip
                    label={`${Object.keys(sheetsData).length} sheets processed`}
                    color="info"
                    variant="outlined"
                  />
                )}
                {errorCount > 0 && (
                  <Chip 
                    label={`${errorCount} errors`} 
                    color="error" 
                    icon={<ErrorIcon />}
                  />
                )}
                {warningCount > 0 && (
                  <Chip 
                    label={`${warningCount} warnings`} 
                    color="warning" 
                    icon={<WarningIcon />}
                  />
                )}
                {duplicateModelNumbers.length > 0 && (
                  <Chip 
                    label={`${duplicateModelNumbers.length} duplicates detected`} 
                    color="info" 
                    icon={<InfoIcon />}
                  />
                )}
                {checkingDuplicates && (
                  <Chip 
                    label="Checking duplicates..." 
                    color="default" 
                    icon={<CircularProgress size={16} />}
                  />
                )}
              </Box>
              
              {/* Quick Fix Buttons */}
              {(errorCount > 0 || warningCount > 0) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<AutoFixIcon />}
                    onClick={() => {
                      const changes = handleBulkCorrection('suggest-brands');
                      if (changes > 0) {
                        alert(`Fixed ${changes} brand names`);
                      } else {
                        alert('No brand corrections needed');
                      }
                    }}
                    variant="outlined"
                  >
                    Fix Brands
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AutoFixIcon />}
                    onClick={() => {
                      const changes = handleBulkCorrection('format-numbers');
                      if (changes > 0) {
                        alert(`Fixed ${changes} number formats`);
                      } else {
                        alert('No number format corrections needed');
                      }
                    }}
                    variant="outlined"
                  >
                    Fix Numbers
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AutoFixIcon />}
                    onClick={() => {
                      const changes = handleBulkCorrection('fix-empty-required');
                      if (changes > 0) {
                        alert(`Added ${changes} missing required values`);
                      } else {
                        alert('No missing required fields to fix');
                      }
                    }}
                    variant="outlined"
                  >
                    Fix Required
                  </Button>
                </Box>
              )}
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Data Preview" />
                <Tab 
                  label={
                    <Badge badgeContent={errorCount + warningCount + infoCount} color={errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "info"}>
                      Validation Results
                    </Badge>
                  } 
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {tabValue === 0 && (
              <Box>
                {selectedSheet && availableSheets.length > 1 && (
                  <Box sx={{ p: 2, bgcolor: processAllSheets ? 'secondary.50' : 'info.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {processAllSheets ? (
                      <Box>
                        <Typography variant="body2" color="secondary.main">
                          🔗 <strong>Combined View:</strong> All {availableSheets.length} sheets
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Data sources: {availableSheets.map(s => s.displayName).join(', ')}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="info.main">
                          📄 Viewing Sheet: <strong>{selectedSheet}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({availableSheets.length} sheets available)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                      {processAllSheets && (
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'secondary.50' }}>
                          📄 Source Sheet
                        </TableCell>
                      )}
                      {expectedColumns.map((column) => (
                        <TableCell key={column.key} sx={{ fontWeight: 'bold' }}>
                          {column.label}
                          {column.required && (
                            <Typography component="span" color="error"> *</Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {processAllSheets ? row._globalRowIndex : row._originalRow}
                        </TableCell>
                        {processAllSheets && (
                          <TableCell sx={{ bgcolor: 'secondary.50' }}>
                            <Chip 
                              label={row._sheetDisplayName || row._sourceSheet} 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                            />
                          </TableCell>
                        )}
                        {expectedColumns.map((column) => (
                          <TableCell key={column.key}>
                            {renderCell(row, index, column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </Box>
            )}

            {/* Validation Results Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                {selectedSheet && availableSheets.length > 1 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {processAllSheets ? (
                      <Box>
                        <Typography variant="subtitle2">Validation results for combined data from all sheets:</Typography>
                        <Typography variant="body2">
                          {Object.entries(sheetsData).map(([sheetName, data]) => 
                            `${data.sheetInfo.displayName}: ${data.rowCount} rows`
                          ).join(', ')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography>Validation results for sheet: <strong>{selectedSheet}</strong></Typography>
                    )}
                  </Alert>
                )}
                {errors.length === 0 ? (
                  <Alert severity="success">
                    All data is valid and ready for upload!
                    {duplicateModelNumbers.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Note: {duplicateModelNumbers.length} products will be updated instead of created as new.
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Found {errors.length} issue(s) that need attention:
                    </Typography>
                    {errors.map((error, index) => (
                      <Alert 
                        key={index} 
                        severity={error.type === 'info' ? 'info' : error.type} 
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2">
                          Row {error.row}:
                        </Typography>
                        {error.errors.map((err, errIndex) => (
                          <Box key={errIndex}>
                            <Typography variant="body2">
                              • {err.message}
                            </Typography>
                            {err.suggestion && (
                              <Typography variant="caption" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                                {err.suggestion}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Alert>
                    ))}
                  </>
                )}
              </Box>
            )}
            
            {/* Sheet Selector */}
            {availableSheets.length > 1 && (
              <Box sx={{ p: 3, bgcolor: 'primary.50', borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Data Source:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {/* All Sheets Option */}
                  <Chip
                    label={`🔗 All Sheets Combined (${combinedData.length} rows)`}
                    onClick={toggleAllSheetsMode}
                    color={processAllSheets ? 'secondary' : 'default'}
                    variant={processAllSheets ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  />
                  
                  {/* Individual Sheet Options */}
                  {availableSheets.map((sheet) => {
                    const sheetRowCount = sheetsData[sheet.name]?.rowCount || 0;
                    return (
                      <Chip
                        key={sheet.name}
                        label={`${sheet.displayName} (${sheetRowCount} rows)`}
                        onClick={() => {
                          if (processAllSheets) {
                            setProcessAllSheets(false);
                          }
                          handleSheetChange(sheet.name);
                        }}
                        color={selectedSheet === sheet.name && !processAllSheets ? 'primary' : 'default'}
                        variant={selectedSheet === sheet.name && !processAllSheets ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                </Box>
                
                {processAllSheets ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      📊 Viewing combined data from all {availableSheets.length} sheets ({combinedData.length} total rows)
                    </Typography>
                  </Alert>
                ) : selectedSheet && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Currently viewing: {selectedSheet}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirmUpload}
          variant="contained"
          disabled={errorCount > 0 || uploading || previewData.length === 0}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : `Upload ${previewData.length} Products`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcelPreviewDialog;