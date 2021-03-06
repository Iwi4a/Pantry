import React, { lazy, Suspense, useReducer, useContext } from 'react';
import {
    Box,
    Container,
    Grid
} from '@material-ui/core';
import './styles.scss';
import {
    requestSingleItem,
    requestCreateItem,
    requestUpdateItem,
    worldOpenFoodFactsAPI
} from './../../crud';
import { Context } from './../ItemsContext';
import HeaderControls from './../../components/HeaderControls/HeaderControls';
import NewProductModal from '../../components/NewProductModal/NewProductModal';
import ItemModal from './../../components/ItemModal/ItemModal';
import ResultModal from './../../components/ResultModal/ResultModal';
import { worldOpenFoodConverter } from '../../utilities';

import {
    reducer,
    ITEM_FOUND,
    CREATE_NEW,
    SCAN_AGAIN,
    SHOW_SCANNER,
    SHOW_RESULT_MODAL,
    SHOW_NEW_ITEM_MODAL,
    SHOW_UPDATE_ITEM_MODAL,
} from './reducer';

const Scanner = lazy(() => import('../../components/Scanner/Scanner'));

const initialState = {
    item: {},
    barcodeId: '',
    barcodeType: '',
    showScanner: false,
    showNewItemModal: false,
    showResultModal: false,
    showUpdateItemModal: false
};

const Header = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { items, getItems } = useContext(Context);

    const onDetect = async ({ barcodeId, barcodeType }) => {
        const fetchedItem = await requestSingleItem(barcodeId);

        if (fetchedItem.data) {
            dispatch({ type: ITEM_FOUND, payload: { data: fetchedItem.data } });
        } else {
            const worldOpenFoodData = await worldOpenFoodFactsAPI(barcodeId);
            if (worldOpenFoodData.status) {
                dispatch({ type: ITEM_FOUND, payload: { data: worldOpenFoodConverter(worldOpenFoodData, barcodeType) } });
            } else {
                console.log('NEXT API')

                dispatch({ type: SHOW_RESULT_MODAL, payload: { show: true, barcodeId, barcodeType } });
            }
        }
    };

    const createNewItem = async (item) => {
        try {
            await requestCreateItem(item);
            getItems([
                item,
                ...items
            ]);
            dispatch({ type: SHOW_NEW_ITEM_MODAL, payload: { show: false } });
        } catch (e) {
            return new Error(e);
        }
    };

    const updateItem = async (unit) => {
        try {
            let response = await requestUpdateItem(unit.item._id, unit);
            if (response.status === 200) {
                let itemExists = false;
                let updatedItemList = items.map(i => {
                    if (i.item._id === unit.item._id) {
                        itemExists = true;
                        return unit;
                    }
                    return i;
                })
                if (!itemExists) {
                    updatedItemList.push(unit)
                }
                getItems(updatedItemList);
                dispatch({ type: SHOW_UPDATE_ITEM_MODAL, payload: { show: false }});
            }
        } catch (e) {
            return new Error(e);
        }
    };

    return (
        <React.Fragment>
            <Box className="Header">
                <Container maxWidth="md" >
                    <Grid container direction="row" justify="center" alignItems="center">
                        <HeaderControls showScanner={() => dispatch({ type: SHOW_SCANNER, payload: { show: true }})} />
                        <Suspense fallback={<h6>Loading...</h6>}>
                            {state.showScanner
                                ? <Scanner
                                    showScanner={state.showScanner}
                                    hideScanner={() => dispatch({ type: SHOW_SCANNER, payload: { show: false }})}
                                    onDetect={onDetect} />
                                : null }
                        </Suspense>
                        { state.showNewItemModal
                            ? <NewProductModal
                                open={state.showNewItemModal}
                                createMode={true}
                                barcodeId={state.barcodeId}
                                barcodeType={state.barcodeType}
                                onClose={() => dispatch({ type: SHOW_NEW_ITEM_MODAL, payload: { show: false }})}
                                onSaveChanges={createNewItem} />
                            : null }
                        { state.showUpdateItemModal
                            ? <ItemModal
                                open={state.showUpdateItemModal}
                                createMode={false}
                                selectedItem={state.item}
                                onClose={() => dispatch({ type: SHOW_UPDATE_ITEM_MODAL, payload: { show: false }})}
                                onSaveChanges={updateItem} />
                            : null }
                        { state.showResultModal
                            ? <ResultModal
                                open={state.showResultModal}
                                barcodeId={state.barcodeId}
                                onScanAgain={() => dispatch({ type: SCAN_AGAIN })}
                                onClose={() => dispatch({ type: SHOW_RESULT_MODAL, payload: { show: false }})}
                                onCreateNew={() => dispatch({ type: CREATE_NEW })} />
                            : null }
                    </Grid>
                </Container>
            </Box>
        </React.Fragment>
    );
};

export default Header;
