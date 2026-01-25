import React, { useState } from 'react';
import Input from '../../common/Input/Input';

function TestInputs() {
    const [formData, setFormData] = useState({
        text: '',
        email: '',
        password: '',
        search: '',
        url: '',
        tel: '',
        number: '',
        select: '',
        checkbox: false,
        radio: false,
        file: '',
        date: '',
        textarea: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={{
            padding: '40px',
            display: 'flex',
            alignContent: 'center',
            justifyContent:'center',
            gap: '30px',
            width: '100vw',
            height: '100vh'
        }}>
            <Input
                type="search"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder='Search Here..'
                label="Full Name"
                iconRight="search"
                iconMarginRight="6xl"
                labelPosition='top'
                required="true"
                iconToggle="search"
                iconFontSize='33xl'
                labelBgColor='transparent'
                inputPaddingLeft="xl"
                fontWeight='400'
                labelFontWeight='500'
                labelColor='yellow-200'
                labelMarginLeft="2xl"
                labelSize='10xl'
                fontSize='10xl'
                size='30xl'
                placeholderColor='black-100'
                squircle="10xl"
                width='700px'
                colorScheme='yellow-300'
                variant='gradient'
                height='50px'
                textColor='black'
            />
        </div>
    );
}

export default TestInputs;